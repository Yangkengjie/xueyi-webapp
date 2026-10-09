function cleanText(value) {
  return String(value || '')
    .replace(/\uFEFF/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitle(value) {
  return cleanText(value)
    .replace(/[：:，,。；;、（）()【】\[\]\s]/g, '')
    .toLowerCase();
}

function hasNonEmpty(list) {
  return Array.isArray(list) && list.some((item) => String(item || '').trim());
}

function hasPayload(node) {
  return hasNonEmpty(node?.content) || hasNonEmpty(node?.notes) || (node?.images || []).length;
}

// 只删除真正的占位节点。课程章节标题即使暂时没有独立正文，也必须保留，
// 否则会把“中医诊断学”后续章节整棵分支误删。
function isPurePlaceholder(node) {
  const title = cleanText(node?.title);
  const children = Array.isArray(node?.children) ? node.children : [];
  if (children.length || hasPayload(node)) return false;
  return /^(图片|图|附件|占位|空节点|暂无内容|未命名)$/i.test(title);
}

function isDuplicateChild(parent, child) {
  const parentTitle = normalizeTitle(parent?.title);
  const childTitle = normalizeTitle(child?.title);
  if (!parentTitle || !childTitle) return false;
  return parentTitle === childTitle;
}

export function pruneCourseNode(node) {
  if (!node) return null;

  const normalized = {
    ...node,
    content: Array.isArray(node.content) ? node.content.filter((x) => String(x || '').trim()) : [],
    notes: Array.isArray(node.notes) ? node.notes.filter((x) => String(x || '').trim()) : [],
    images: Array.isArray(node.images) ? node.images.filter(Boolean) : [],
    tags: Array.isArray(node.tags) ? node.tags.filter(Boolean) : [],
    children: [],
  };

  const seen = new Set();
  normalized.children = (node.children || [])
    .map(pruneCourseNode)
    .filter(Boolean)
    .filter((child) => {
      // 删除父子完全同名的冗余末端节点
      if (isDuplicateChild(normalized, child)) return false;
      // 同一父节点下的完全重复标题只保留第一项
      const key = normalizeTitle(child.title);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  if (isPurePlaceholder(normalized)) return null;
  return normalized;
}

export function pruneCourse(course) {
  if (!course?.root) return course;
  return { ...course, root: pruneCourseNode(course.root) };
}

export function buildPrunedCourses(courses) {
  return Object.fromEntries(
    Object.entries(courses || {}).map(([id, course]) => [id, pruneCourse(course)])
  );
}
