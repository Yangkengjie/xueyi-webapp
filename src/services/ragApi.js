const RAG_ENDPOINT = '/rag-api/retrieval/general';
const DEFAULT_MIN_SCORE = 0.30;

function decodeEscapedText(value) {
  return String(value || '')
    .replace(/\\u003c/gi, '<')
    .replace(/\\u003e/gi, '>')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function stripImagePlaceholders(text) {
  return decodeEscapedText(text)
    .replace(/<span\b[^>]*\bclass=["'][^"']*\bimage\b[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<span\b[^>]*\bimage\b[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/\bplaceholder["']?\s*>?/gi, '')
    .replace(/\boriginal-image-(src|title)=["'][^"']*["']/gi, '')
    .replace(/\bimages\/[\w./-]+\.(png|jpe?g|gif|webp|svg)\b/gi, '')
    .replace(/\b[\w.-]+\.(png|jpe?g|gif|webp|svg)\b/gi, '');
}

function normalizeMarkdownLine(line) {
  return String(line || '')
    .replace(/\\([\[\]()*#])/g, '$1')
    .replace(/^\s*#{1,6}\s*/g, '')
    .replace(/^\s*>\s?/g, '')
    .replace(/^\s*[-*+•]\s+/g, '')
    .replace(/^\s*[—–-]\s*/g, '')
    .replace(/^\s*(?:\[)?(?:\d+|[一二三四五六七八九十]+)(?:\])?\s*/g, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function isNoiseLine(line) {
  const value = String(line || '').trim();
  if (!value) return true;
  const compact = value.replace(/[\s\-—–•·：:，,。；;、（）()【】\[\]<>]/g, '').trim();
  if (!compact) return true;
  if (/^(placeholder|span|images?|originalimagesrc|originalimagetitle)$/i.test(compact)) return true;
  if (/^[\w./-]+\.(png|jpe?g|gif|webp|svg)$/i.test(value)) return true;
  if (/^(src|href|class|style)=/i.test(value)) return true;
  return false;
}

export function cleanRagText(value) {
  const raw = stripImagePlaceholders(value)
    .replace(/<[^>]+>/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\r/g, '');

  const lines = raw
    .split('\n')
    .map(normalizeMarkdownLine)
    .filter(line => !isNoiseLine(line));

  const output = [];
  const seenRecent = new Set();
  for (const line of lines) {
    const key = normalizeForDedupe(line);
    if (!key) continue;
    if (seenRecent.has(key)) continue;
    output.push(line);
    seenRecent.add(key);
    if (seenRecent.size > 18) seenRecent.delete(normalizeForDedupe(output[Math.max(0, output.length - 19)]));
  }

  return output.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function isMeaningfulText(text) {
  const value = String(text || '').trim();
  if (value.length < 18) return false;
  const plain = value.replace(/[\s\W_]/g, '');
  if (plain.length < 8) return false;
  const noiseHits = (value.match(/placeholder|original-image|images\/|<span|<\/span>/gi) || []).length;
  return noiseHits === 0;
}

function normalizeForDedupe(value) {
  return String(value || '')
    .replace(/\s+/g, '')
    .replace(/\[\d+\]/g, '')
    .replace(/[\-—–•·：:，,。；;、（）()【】\[\]]/g, '')
    .toLowerCase();
}

function extractKeywords(query) {
  const cleaned = String(query || '')
    .replace(/^(中医辨证|中药方剂|中医经典|经络穴位)\s*[·、,，:：-]?\s*/g, '')
    .trim();
  const parts = cleaned.split(/[\s·、,，;；/\\（）()]+/).map(s => s.trim()).filter(Boolean);
  const keywords = new Set(parts.filter(s => s.length >= 2));
  if (cleaned.length >= 2) keywords.add(cleaned);
  return [...keywords].sort((a, b) => b.length - a.length);
}

function lineRelevance(line, keywords) {
  const text = String(line || '');
  let score = 0;
  for (const word of keywords) {
    if (!word) continue;
    if (text.includes(word)) score += 10 + Math.min(word.length, 8);
    else {
      const chars = [...word].filter(ch => ch.length && text.includes(ch)).length;
      if (word.length >= 4 && chars >= Math.ceil(word.length * 0.7)) score += 3;
    }
  }
  return score;
}

// 从大段 parent_content 中截取与用户问题最接近的上下文，避免整章直接倾倒到页面。
function extractRelevantWindow(text, query, maxLines = 10) {
  const cleaned = cleanRagText(text);
  const lines = cleaned.split('\n').map(s => s.trim()).filter(Boolean);
  if (lines.length <= maxLines) return cleaned;

  const keywords = extractKeywords(query);
  const scored = lines.map((line, index) => ({ index, score: lineRelevance(line, keywords) }));
  const best = scored.sort((a, b) => b.score - a.score || a.index - b.index)[0];

  if (!best || best.score <= 0) return lines.slice(0, Math.min(maxLines, 6)).join('\n');

  let start = Math.max(0, best.index - 2);
  let end = Math.min(lines.length, best.index + maxLines - 2);

  // 向上带一条最近的章节标题，让结果不失去上下文。
  for (let i = best.index - 1; i >= Math.max(0, best.index - 8); i -= 1) {
    if (/^(第[一二三四五六七八九十\d]+[章节]|[一二三四五六七八九十]+、)/.test(lines[i])) {
      start = i;
      break;
    }
  }

  const selected = lines.slice(start, end);
  return selected.join('\n');
}

function pickChunkText(chunk, query) {
  const content = cleanRagText(chunk?.content || '');
  const parent = cleanRagText(chunk?.parent_content || '');

  if (isMeaningfulText(content)) {
    // 精确 chunk 足够时优先展示，但仍限制过长内容。
    return extractRelevantWindow(content, query, 9);
  }
  if (isMeaningfulText(parent)) return extractRelevantWindow(parent, query, 10);
  return content || parent || '';
}

function flattenChunks(message) {
  const chunks = [];
  for (const collection of Array.isArray(message) ? message : []) {
    for (const document of collection?.documents || []) {
      for (const chunk of document?.chunks || []) {
        chunks.push({ ...chunk, filename: document?.filename || chunk?.citation?.source_name || '' });
      }
    }
  }
  return chunks;
}

function relevanceScore(text, query) {
  const keywords = extractKeywords(query);
  const lines = String(text || '').split('\n');
  const lineScore = lines.reduce((sum, line) => sum + Math.min(lineRelevance(line, keywords), 18), 0);
  const exactBonus = keywords.some(word => String(text || '').includes(word)) ? 20 : 0;
  return lineScore + exactBonus;
}

function uniqueResults(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = normalizeForDedupe(item.text);
    if (!key || seen.has(key)) return false;
    // 高度相似的短结果也视为重复，避免同一段知识重复出现。
    for (const previous of seen) {
      const shorter = key.length < previous.length ? key : previous;
      const longer = key.length < previous.length ? previous : key;
      if (shorter.length >= 16 && longer.includes(shorter)) return false;
    }
    seen.add(key);
    return true;
  });
}

export function buildRagQuery({ courseName, nodePath, title }) {
  const parts = [courseName, nodePath, title]
    .map(v => String(v || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  return [...new Set(parts)].join(' · ');
}

export async function retrieveKnowledge({ query, collectionId, topK = 6, minScore = DEFAULT_MIN_SCORE, userQuery = '' }) {
  if (!collectionId) return { ok: false, reason: 'missing_collection_id', results: [] };

  const response = await fetch(RAG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, collection_ids: [collectionId], top_k: topK }),
  });

  if (!response.ok) throw new Error(`RAG request failed: ${response.status}`);
  const payload = await response.json();
  if (!payload?.success) throw new Error(payload?.message?.key || payload?.message || 'RAG request failed');

  const intent = userQuery || query;
  const chunks = flattenChunks(payload.message)
    .map(chunk => {
      const apiScore = Number(chunk.score ?? chunk.raw_score ?? 0);
      const text = pickChunkText(chunk, intent);
      const localScore = relevanceScore(text, intent);
      return {
        id: chunk.id,
        score: apiScore,
        localScore,
        combinedScore: apiScore * 100 + localScore,
        text,
        filename: chunk.filename,
        citation: chunk.citation || null,
      };
    })
    .filter(item => item.text && item.score >= minScore)
    .sort((a, b) => b.combinedScore - a.combinedScore);

  const results = uniqueResults(chunks).slice(0, 3);
  return { ok: true, results, raw: payload };
}

export const retrieveCourseKnowledge = retrieveKnowledge;
