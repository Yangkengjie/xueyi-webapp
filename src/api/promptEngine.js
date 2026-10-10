/* 学医智用 · 提示词增强引擎（初版前端复刻 — 与独立项目“中医学习问题理解与增强引擎---学医智用”完全对齐）

   对齐目标：
   - 字段结构：独立项目 src/types.ts 的 QuestionAnalysis / AnswerPayload / ABComparison / RelatedKnowledgeNode / ChatMessage 结构完全一致
   - 9 模式常量：独立项目 OutputModeType 1:1
   - 内容模板：独立项目 server.ts generateLocalStructuredResponse 与 DeductionTab 9 模式内容完全一致
   - 真实后端钩子：callEnhanceServer 指向独立项目 server.ts 的 POST /api/enhance-and-answer
*/

import { mockResponse } from "./index";
import { apiUrl } from "../utils/apiBase";
import { profileRows } from "../mock/data";
import { getStudyStatus } from "./study";
import {
  ENGINE_OUTPUT_MODES,
  PRESET_QUESTIONS,
  KNOWLEDGE_GRAPH_NODES,
  PRESET_STUDENT_PROFILE,
} from "../data/tcmPresetData";

/* ========== 一、9 模式常量与双向映射：完全对应 OutputModeType ========== */

export const MODE_LABELS = ENGINE_OUTPUT_MODES.slice();

/* settings.js answerStyles(key) <-> engine selectedOutputs(label) 双向映射
   注意：独立 engine 项目 settings.js 定义的 9 条 key 与下面 key 顺序完全一致 */
export const MODE_KEY_LABEL_PAIRS = [
  { key: "direct",   label: "直接精准模式" },
  { key: "guide",    label: "引导式对话模式" },
  { key: "clinical", label: "临床案例模式" },
  { key: "image",    label: "图像解说模式" },
  { key: "analogy",  label: "通俗类比模式" },
  { key: "ancient",  label: "古籍溯源模式" },
  { key: "schools",  label: "医家各说模式" },
  { key: "modern",   label: "现代研究模式" },
  { key: "formula",  label: "关联方药模式" },
];
export const MODE_KEY_TO_LABEL = Object.fromEntries(MODE_KEY_LABEL_PAIRS.map((p) => [p.key, p.label]));
export const MODE_LABEL_TO_KEY = Object.fromEntries(MODE_KEY_LABEL_PAIRS.map((p) => [p.label, p.key]));
export const ALL_MODE_KEYS = MODE_KEY_LABEL_PAIRS.map((p) => p.key);

/* QA / 规划两种模式的默认勾选（与独立 engine DeductionTab 默认选中 4 项 + 规划 tab 默认保持一致）*/
export const DEFAULT_QA_MODE_LABELS = ["直接精准模式", "通俗类比模式", "临床案例模式", "关联方药模式"];
export const DEFAULT_PLAN_MODE_LABELS = ["引导式对话模式", "图像解说模式", "现代研究模式"];

/* 默认上下文（对应 engine server.ts 的默认入参） */
export const DEFAULT_ENGINE_CONTEXT = {
  studentGrade: "大一",
  currentCourse: "中医基础理论",
  userPreference: "机制推演与对比分析型",
};

/* 从本地资料与学习状态拼出真实用户画像（供 TutorView 首次提问、AnswerView 追问复用）
   优先读 user.js 的真实档案（localStorage xy-api-user，"我的"页可编辑），
   读不到再回退到 mock/profileRows 硬编码默认值。 */
function readRealProfile() {
  try {
    const raw = localStorage.getItem("xy-api-user");
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

export function buildUserContextFromLocal() {
  const real = readRealProfile() || {};
  const row = (key) => (profileRows.find((r) => r.key === key) || {}).value || "";
  const grade = real.grade || row("grade") || "大一";
  const major = real.major || row("major") || "中医学5年制";
  const persona = real.persona || row("persona") || "体系构建师";
  const school = real.school || "";
  let studyStatus = {};
  try { studyStatus = getStudyStatus() || {}; } catch (_) {}
  const bits = [];
  if (studyStatus.learningDays) bits.push(`累计学习${studyStatus.learningDays}天`);
  if (studyStatus.totalHours) bits.push(`累计${studyStatus.totalHours}小时`);
  if (studyStatus.streakDays) bits.push(`连续打卡${studyStatus.streakDays}天`);
  return {
    studentGrade: `${grade}·${major}${school ? `·${school}` : ""}`,
    currentCourse: "中医基础理论 / 方剂学",
    userPreference: persona,
    studyStats: {
      learningDays: studyStatus.learningDays || 0,
      totalHours: studyStatus.totalHours || 0,
      streakDays: studyStatus.streakDays || 0,
      todayMinutes: studyStatus.todayMinutes || 0,
      summary: bits.join("、"),
    },
  };
}

/* ========== 二、settings keys -> engine selectedOutputs labels 转换 ========== */

export function keysToModeLabels(modeKeys, kind = "qa") {
  const list = Array.isArray(modeKeys) ? modeKeys.slice() : [];
  const filtered = list
    .map((k) => MODE_KEY_TO_LABEL[k])
    .filter(Boolean);
  if (filtered.length) return filtered;
  return (kind === "plan" ? DEFAULT_PLAN_MODE_LABELS : DEFAULT_QA_MODE_LABELS).slice();
}
export function labelsToModeKeys(labels) {
  const list = Array.isArray(labels) ? labels : [];
  return list.map((l) => MODE_LABEL_TO_KEY[l]).filter(Boolean);
}

/* ========== 三、真实后端钩子：POST /api/enhance-and-answer（独立项目 server.ts）========== */

/* 服务端 → 主工程 的结构归一化（只改不合规字段，保留原始其他值）：
   1. abComparison：如果是 comparisonMetrics 嵌套，把 4 个 "+XX%" 字符串抽成平层纯数字（Number，0-100+）
   2. relatedKnowledgeNodes[].strength：如果是 0-1 浮点，乘 100 变 0-100；如果已经是百分比 Number/String，转数字
   3. answer.sections：兜底补 mode/title/content，防止后续 engineSectionsToAnswerSampleSections 空过滤 */
function toPctNumber(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") {
    return v <= 1 && v >= -1 ? Math.round(v * 100) : Math.round(v);
  }
  const s = String(v).trim().replace(/%$/, "").replace(/^\+/, "");
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  /* 字符串形式的 0-1 浮点数（如 "0.88"、".9"）同样视为 0-1 浮点比例，乘 100 转百分比 */
  if (/^(?:-?\d*\.\d+|-?0)$/.test(s) || (n <= 1 && n >= -1 && /^\d?\.\d/.test(s))) {
    return Math.round(n * 100);
  }
  return Math.round(n);
}
export function normalizeEngineResponse(raw) {
  if (!raw || typeof raw !== "object") return raw;
  const out = Array.isArray(raw) ? raw.slice() : { ...raw };

  /* 1) abComparison 归一化 */
  if (out.abComparison && typeof out.abComparison === "object") {
    const src = out.abComparison;
    const metrics = (src.comparisonMetrics && typeof src.comparisonMetrics === "object") ? src.comparisonMetrics : null;
    const merged = { ...src };
    ["accuracyDiff", "completenessDiff", "understandabilityDiff", "knowledgeExpansionDiff"].forEach((k) => {
      if (typeof merged[k] === "undefined" || merged[k] === null) {
        if (metrics && typeof metrics[k] !== "undefined") {
          merged[k] = toPctNumber(metrics[k]);
        }
      } else {
        merged[k] = toPctNumber(merged[k]);
      }
    });
    /* 保留 comparisonMetrics（兄弟引擎自己 React 前端用），但给主工程平层字段 */
    out.abComparison = merged;
  }

  /* 2) relatedKnowledgeNodes strength 归一化 + name 兼容 */
  if (Array.isArray(out.answer?.relatedKnowledgeNodes)) {
    out.answer = { ...out.answer };
    out.answer.relatedKnowledgeNodes = out.answer.relatedKnowledgeNodes.map((n) => {
      if (!n || typeof n !== "object") return n;
      const node = { ...n };
      node.strength = toPctNumber(node.strength);
      /* targetName 兄弟引擎旧字段 → 主工程 AnswerView 读 name，双写两边都兼容 */
      if (!node.name && node.targetName) node.name = node.targetName;
      if (!node.targetName && node.name) node.targetName = node.name;
      if (!node.relationType && node.type) node.relationType = node.type;
      return node;
    });
  }

  /* 3) sections 兜底：至少保证每个 section 有 mode + title + content */
  if (Array.isArray(out.answer?.sections)) {
    out.answer = { ...out.answer };
    out.answer.sections = out.answer.sections.map((s, i) => {
      if (!s || typeof s !== "object") return { mode: MODE_LABELS[i % MODE_LABELS.length], title: "要点解析", content: "" };
      const sec = { ...s };
      if (!sec.mode) sec.mode = MODE_LABELS[i % MODE_LABELS.length];
      if (!sec.title) sec.title = sec.mode || "要点解析";
      if (typeof sec.content !== "string") sec.content = String(sec.content ?? "");
      return sec;
    });
  }

  /* 4) analysis.outputModes 兜底：如果不是数组，就从 sections.mode 去重抽一个 */
  if (out.analysis && typeof out.analysis === "object") {
    out.analysis = { ...out.analysis };
    if (!Array.isArray(out.analysis.outputModes) || !out.analysis.outputModes.length) {
      const fromSec = Array.from(new Set(out.answer?.sections?.map((s) => s.mode).filter(Boolean) || []));
      out.analysis.outputModes = fromSec.length ? fromSec : DEFAULT_QA_MODE_LABELS.slice();
    }
  }

  return out;
}

export async function callEnhanceServer(payload) {
  if (typeof fetch !== "function") return null;
  try {
    const resp = await fetch(apiUrl("/api/enhance-and-answer"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const normalized = data && typeof data === "object" ? normalizeEngineResponse(data) : null;
    return normalized;
  } catch (_) {
    return null;
  }
}

/* SnapDeploy 免费容器休眠后：脚本请求（fetch/curl）不会唤醒容器，
   只有浏览器文档请求（页面导航/iframe）能触发平台自动唤醒（约 60 秒）。
   用隐藏 iframe 发起一次跨域文档请求完成唤醒。 */
let wakeIframe = null;
function triggerBrowserWake() {
  if (!API_BASE || typeof document === "undefined") return;
  try {
    if (wakeIframe) { try { wakeIframe.remove(); } catch (_) {} }
    wakeIframe = document.createElement("iframe");
    wakeIframe.style.cssText = "position:fixed;width:1px;height:1px;border:0;left:-9999px;bottom:0;opacity:0;pointer-events:none;";
    wakeIframe.ariaHidden = "true";
    wakeIframe.src = `${API_BASE}/?wake=${Date.now()}`;
    document.body.appendChild(wakeIframe);
    setTimeout(() => { try { wakeIframe?.remove(); } catch (_) {} wakeIframe = null; }, 120000);
  } catch (_) {}
}

const healthOk = async () => {
  try {
    const resp = await fetch(apiUrl("/api/health"), { method: "GET", cache: "no-store" });
    return resp.ok;
  } catch (_) { return false; }
};

/* 确保引擎就绪：先探测；休眠则用浏览器文档请求唤醒并轮询至 200 */
export async function waitForEngineReady({ timeoutMs = 180000, intervalMs = 5000 } = {}) {
  if (await healthOk()) return true;
  triggerBrowserWake();
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, intervalMs));
    if (await healthOk()) return true;
  }
  return false;
}

/* 供页面进入时提前预热（不阻塞、不抛错） */
export function prewarmEngine() {
  healthOk().then((ok) => { if (!ok) triggerBrowserWake(); });
}

/* 流式调用：onDelta 逐字回调，onDone 收到完整结构化结果 */
export async function callEnhanceServerStream(payload, onDelta, onDone) {
  if (typeof fetch !== "function") return false;
  try {
    const resp = await fetch(apiUrl("/api/enhance-stream"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    if (!resp.ok || !resp.body) return false;
    const reader = resp.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let eventName = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() || "";
      for (const block of blocks) {
        let ev = "message", dataStr = "";
        for (const line of block.split("\n")) {
          if (line.startsWith("event:")) ev = line.slice(6).trim();
          else if (line.startsWith("data:")) dataStr += line.slice(5).trim();
        }
        if (!dataStr) continue;
        try {
          const data = JSON.parse(dataStr);
          if (ev === "delta" && data.text) onDelta?.(data.text);
          else if (ev === "done") onDone?.(normalizeEngineResponse(data));
          else if (ev === "error") throw new Error(data.msg || "流式错误");
        } catch (_) {}
      }
    }
    return true;
  } catch (_) {
    return false;
  }
}

/* ========== 四、纯前端复刻：generateLocalStructuredResponse（字段与 types.ts 完全一致） ========== */

function detectTopicHints(question = "") {
  const q = String(question || "");
  return {
    isYinxu: /阴虚|五心潮热|潮热|盗汗|知柏|六味|舌红少苔|细数脉/.test(q),
    isYangxu: /阳虚|低热|补中益气|甘温除热|阴火|浮阳|戴阳|气虚发热/.test(q),
    isFangji: /汤|方|厚朴|半夏|桂枝|麻黄|柴胡|白虎|承气|六味|补中|归脾|当归补血/.test(q),
    isExam: /考试|考点|重点|易错|鉴别|对比|区别| vs |\/|和.*区别/.test(q),
    isPlan: /计划|规划|复习|备考|月|天|阶段|目标|考研|执业医|资格证/.test(q),
  };
}

/* 9 模式模板：与 engine server.ts 内容 1:1 对齐（未改动） */
function buildModeSectionCatalog() {
  return {
    直接精准模式: {
      title: "核心病机与本质定义",
      variants: {
        yinxu: "阴液亏耗，水不制火，虚热内生。五心（手心、足心、胸中）为心肾阴经气血汇聚之处，阴亏则虚火循经上浮内扰；午后至入夜阳气入阴，阴虚不能敛阳，故发热如潮水定时而发。",
        yangxu: "阳气虚衰致虚阳外浮（气虚发热 / 戴阳），或中气下陷导致阴火上冲。午后夜间阴阳交接，正不胜邪，故表现为低热，本质属虚。",
        fangji: "方剂主治病机与配伍机制。以核心病机为轴，按“君臣佐使”拆解方义：君药定方向、臣药增效、佐药兼治反佐、使药引经报使；结合煎服法与禁忌加深理解。",
        exam: "核心考点与鉴别链：先锁定病位病性，再按“主症 + 舌脉 + 类证鉴别 + 代表方”四层输出。",
        default: "从脏腑阴阳、气血津液、经络循行的平衡角度解析核心病机，锁定病位、病性、病势三层，形成完整辨证链路。",
      },
    },
    引导式对话模式: {
      title: "学伴启发与思路点拨",
      variants: {
        yinxu: "💡 思考一下：为什么发热偏偏是在“手心、脚心、胸口”而不是全身大热？\n这是因为手心劳宫穴归心包经，足心涌泉穴归肾经，胸中为膻中（心之宫城）。当你联想到“肾主藏精、心主血脉”时，是不是立刻能把中基的经络脏腑和中诊的症状串起来了？",
        yangxu: "💡 想一想：阳虚的人本应畏寒肢冷，为什么反而会体温升高出现低热？\n试着回忆李东垣《脾胃论》中的“阴火”理论——脾胃之气下陷，谷气不升，伏留于下焦而生内热。",
        fangji: "💡 试着列 3 条答案：①君药是谁？解决什么病机？②臣药/佐药如何辅助君药？③如果去掉某一味药，方义会发生什么变化？",
        exam: "💡 先自己写出该考点的 3 条“最易混淆辨析项”，再对比教材原文找出你遗漏的关键体征或舌脉。",
        default: "💡 尝试思考：抓住该证候或方药的“特征性表现”与“舌脉特异性”，我们该如何逐步排除相近证型？",
      },
    },
    临床案例模式: {
      title: "典型病案与四诊合参",
      variants: {
        yinxu: "【病案记录】：患者女，21岁中医大一学生，期末熬夜备考后出现傍晚手足心烦热，伴口燥咽干、夜间盗汗。诊见舌质红、苔剥脱，脉细数。辨证为“肾阴亏虚，虚热内生”，以知柏地黄丸加减滋阴降火。",
        yangxu: "【病案记录】：患者男，48岁，劳累后常感午后微热（37.4℃），少气懒言，便溏，身虽微热但喜温水。舌淡胖有齿痕，脉沉细无力。辨证为“脾胃气虚发热”，投补中益气汤3剂，体温恢复正常。",
        fangji: "【病案记录】：以主诉为切入，按“主诉→现病史→既往史→过敏史→四诊合参（舌脉）→辨证→治法→方药→调护”的完整链条书写，注意方证对应与剂量变化。",
        exam: "【病案记录】：写真题病案：主诉 3 条必带（主症 + 时间 + 加重/缓解因素），舌脉一定写清楚，最后写辨证分型、治法、方药、剂量。",
        default: "【病案记录】：临床辨证注重四诊合参，抓住“主诉-现病史-舌象-脉象”证据链，形成完整的理法方药闭环；鉴别诊断至少列出 2 个易混证型。",
      },
    },
    图像解说模式: {
      title: "病机传变链路与结构图解",
      variants: {
        yinxu: "【病机链路图解】：\n久病 / 熬夜耗伤精血 ──▶ 肾水不足（水箱枯竭） ──▶ 水不涵木、水不制火 ──▶ 虚热内炽 ──▶ 五心烦热 / 骨蒸潮热 / 舌红少苔细数脉",
        yangxu: "【病机链路图解】：\n劳倦 / 饮食伤脾 ──▶ 中气下陷 ──▶ 谷气下流 ──▶ 下焦伏留化热（阴火） ──▶ 低热 / 自汗 / 少气懒言",
        fangji: "【组方结构图解】：\n君药 ──▶ 解决主病主证\n├ 臣药 ──▶ 加强君药功效\n├ 佐药 ──▶ 兼证 + 反佐\n└ 使药 ──▶ 引经 + 调和诸药",
        exam: "【考点图谱】：\n顶层：证型\n├ 主症分支（症候群）\n├ 舌脉分支（客观金指标）\n├ 治法分支\n└ 方药分支（代表方 + 经典药对）",
        default: "【知识图谱结构】：\n病因 → 病位（脏腑/经络/六经/卫气营血）→ 病性（寒热虚实阴阳）→ 证候 → 治法 → 代表方 → 常用中药 → 鉴别要点",
      },
    },
    通俗类比模式: {
      title: "生活化比喻模型（降低初学负荷）",
      variants: {
        yinxu: "【水壶煮水模型】：把人体比作一个正在加热的茶壶，阳气是炉火，阴液是壶里的水。\n当水充足时，炉火再旺水温也平衡稳定；如果水快烧干了（阴虚），哪怕火没有调大，壶底和壶壁也会被烧得滚烫发焦（虚热）。手心脚心就是壶身导热最敏感的受热点。",
        yangxu: "【油灯与微风模型】：阳虚发热好比油灯里的灯油快耗尽了，灯芯摇摇欲坠，微风一吹火苗不仅不稳，反而突然往上乱窜（虚阳浮越）。虽然看见火光，底座却是冰凉的。",
        fangji: "【足球队模型】：一首方剂就是一支足球队：君=前锋（主攻）、臣=中场（输送弹药）、佐=后卫/门将（防守反佐）、使=教练（调度指挥、引经报使）。",
        exam: "【抽屉收纳模型】：考点像衣服，八纲=衣柜（表/里/寒/热/虚/实/阴/阳），脏腑=抽屉，舌脉=标签，考场上只要先找到“哪一柜哪一屉”就不会乱。",
        default: "【城市管道供水模型】：气为动力水泵，血为自来水流，经络为城市管网，津液是河道水库。动力足、水源清、管道畅，各脏腑街区才能水润通达；哪里堵、哪里漏，就会出现对应的证候。",
      },
    },
    古籍溯源模式: {
      title: "经典古籍原文依据",
      variants: {
        yinxu: "《素问·调经论》：“阴虚生内热奈何？……阴气衰，天气闭塞，故神气上冲，但热不恶寒，故曰内热。”\n《景岳全书·传忠录》：“阳胜则身热，腠理闭，喘粗，为之俯仰，汗不出而热，齿干以烦冤，腹满死，能冬不能夏。”",
        yangxu: "《黄帝内经·素问·阴阳应象大论》：“阴在内，阳之守也；阳在外，阴之使也。阴平阳秘，精神乃治。”\n《脾胃论·饮食劳倦所伤始为热中论》：“脾胃气虚，则下流于肾，阴火得以乘其土位。”",
        fangji: "《伤寒论》原方条文 + 《医方考》《医宗金鉴·删补名医方论》对方义的拆解；对照原文背方歌更容易记住“为什么这么配伍”。",
        exam: "【必背原文 + 条文号】：把高频考点对应的《伤寒论》《金匮》条文号记在卡片正面，条文原文写背面，考前 3 天翻卡片自测。",
        default: "【经典原文】：建议回查《黄帝内经素问》《灵枢》《难经》《伤寒论》《金匮要略》《温病条辨》对应条文，按“原文 + 校注 + 后世发挥”三层做卡片。",
      },
    },
    医家各说模式: {
      title: "历代名医学术观点辨析",
      variants: {
        yinxu: "• 朱丹溪（滋阴派）：“阳常有余，阴常不足”，强调保护真阴，主张用熟地、黄柏、知母滋水降火。\n• 张景岳（温补派）：“善补阴者，必于阳中求阴，则阴得阳升而泉源不竭”，主张阴阳互济互根。",
        yangxu: "• 李东垣（脾胃论）：“内伤脾胃，百病由生”，创甘温除大热之法，代表方补中益气汤。\n• 张景岳 / 郑钦安：重视命门真火，提出“阳主阴从”，用附子、干姜回阳救逆、引火归元。",
        fangji: "• 仲景：方证对应，药简力专；\n• 叶天士 / 吴鞠通：温病方剂注重轻灵透达；\n• 王清任：血瘀证方剂注重逐瘀与补气并行。",
        exam: "• 考点视角：同样一个“发热”，仲景看六经（太阳/阳明/少阳），东垣看脾胃（阴火），叶天士看卫气营血；考试要按题干给出的“学术语境”选择学派。",
        default: "【历代医家观点】：每一个考点建议至少列出 3 位代表医家的不同视角（如外感宗仲景、内伤遵东垣、温病学叶薛吴王），做横向对比表。",
      },
    },
    现代研究模式: {
      title: "现代生理与药理学机制",
      variants: {
        yinxu: "现代医学研究表明：中医“阴虚内热”状态常伴有自主神经系统功能紊乱（交感神经兴奋性偏高）、下丘脑-垂体-甲状腺 / 肾上腺皮质轴亢进，以及基础代谢率轻微上升和微循环障碍，这解释了患者自觉肢端发热而体温计测量通常正常的现象。",
        yangxu: "现代药理与微循环研究证实：甘温除热代表方（补中益气汤等）通过多靶点调节神经-内分泌-免疫网络（NEI 网络），改善肠道屏障、炎症因子水平与细胞能量代谢，从而纠正“气虚发热”的低烈度慢性炎症状态。",
        fangji: "【现代药理】：中药复方多通过“多成分-多靶点-多通路”协同起效；常用方法包括：网络药理学、代谢组学、肠道菌群 16S 测序、分子对接、血清药物化学等。",
        exam: "【近年真题热点】：常考“某代表方的现代药理作用”——如补中益气汤的免疫调节、六味地黄丸对 HPA 轴的影响、黄连解毒汤的抗炎机制等。",
        default: "【现代机制】：中药复方多通过“多成分-多靶点-多通路”协同起效；常用方法包括：网络药理学、代谢组学、肠道菌群 16S 测序、分子对接等。",
      },
    },
    关联方药模式: {
      title: "对证方剂与药对配伍拓展",
      variants: {
        yinxu: "【核心对证方】：六味地黄丸（三补三泻：熟地配泽泻、山茱萸配丹皮、山药配茯苓）、知柏地黄丸（滋阴降火代表方）、大补阴丸（培本清源）。\n【经典药对】：知母 + 黄柏（清退虚热），鳖甲 + 地骨皮（滋阴退蒸），生地 + 玄参（增液滋阴）。",
        yangxu: "【核心对证方】：补中益气汤（甘温除大热代表）、理中丸（温中祛寒）、金匮肾气丸 / 右归丸（温补肾阳）。\n【经典药对】：附子 + 干姜（回阳救逆），黄芪 + 党参 / 人参（益气升阳），升麻 + 柴胡（升阳举陷）。",
        fangji: "【方药拓展】：除记忆方歌、组成、功用主治外，重点拆解“核心药对 + 加减变化 + 类方鉴别”；建议用“异病同治 / 同病异治”双向串联方剂。",
        exam: "【核心必考药对】：麻黄+桂枝、附子+干姜、知母+黄柏、升麻+柴胡、当归+黄芪、半夏+厚朴、石膏+知母；记住“剂量变化带来的方义转变”。",
        default: "【相关方药联想】：按“治法 → 代表方 → 核心药对 → 常用中药 → 相似方鉴别”的层级构建知识树；至少关联 2 张代表方与 3 组经典药对。",
      },
    },
  };
}

const _CATALOG = buildModeSectionCatalog();

/* 根据问题选 variant 键 */
function pickVariantKey(hints) {
  if (hints.isYinxu) return "yinxu";
  if (hints.isYangxu) return "yangxu";
  if (hints.isFangji) return "fangji";
  if (hints.isExam) return "exam";
  return "default";
}

/* 从 KNOWLEDGE_GRAPH_NODES 根据题干关键词挑选 relatedKnowledgeNodes */
function pickRelatedNodes(question, count = 3) {
  const q = String(question || "");
  const scored = KNOWLEDGE_GRAPH_NODES
    .slice()
    .map((node) => {
      let score = 0;
      const haystack = (node.name + " " + (node.category || "") + " " + (node.course || "") + " " + (node.description || ""));
      if (q && haystack) {
        const qTerms = q.split(/[，。？、\s/,，。？!！：:；;“”""'()（）【】\[\]《》]/).filter(Boolean);
        qTerms.forEach((t) => {
          if (t.length >= 2 && haystack.includes(t)) score += 2;
        });
      }
      if (node.mastery === "mastered") score += 0.3;
      if (node.mastery === "learning") score += 0.15;
      return { node, score, r: node.relations && node.relations[0] ? node.relations[0] : null };
    })
    .sort((a, b) => b.score - a.score || (b.r?.strength || 0) - (a.r?.strength || 0));
  return scored.slice(0, count).map(({ node, r }) => ({
    name: node.name,
    course: node.course,
    strength: Number((r?.strength != null ? r.strength : 0.8).toFixed(2)),
    relationType: r?.type || "核心知识点 / 鉴别延伸",
    reason: r ? `${r.targetName || node.name}（${r.type}）` : `与“${String(question || "当前问题").slice(0, 10)}”强关联，建议同步巩固`,
  }));
}

/* engine 对外标准输出结构 */
export function generateLocalStructuredResponse({
  question,
  selectedOutputs = DEFAULT_QA_MODE_LABELS,
  studentGrade = DEFAULT_ENGINE_CONTEXT.studentGrade,
  currentCourse = DEFAULT_ENGINE_CONTEXT.currentCourse,
  userPreference = DEFAULT_ENGINE_CONTEXT.userPreference,
} = {}) {
  const q = String(question || "").trim();
  const hints = detectTopicHints(q);
  const vKey = pickVariantKey(hints);

  const outputModes = Array.isArray(selectedOutputs) && selectedOutputs.length
    ? selectedOutputs.filter((m) => MODE_LABELS.includes(m))
    : DEFAULT_QA_MODE_LABELS.slice();

  const sections = outputModes.map((mode) => {
    const def = _CATALOG[mode];
    const title = def?.title || mode;
    let content = "";
    if (def?.variants) {
      content = def.variants[vKey] || def.variants.default || "";
    }
    if (!content) content = "针对该模式的中医学科解析内容，结合具体知识点层层剖析。";
    return { mode, title, content };
  });

  /* analysis.topic / intent（与 engine server.ts 保持一致） */
  let analysisTopic = q ? q.slice(0, 18) : "中医学习问题理解";
  let analysisIntent = "概念辨析与知识建构";
  if (hints.isYinxu) { analysisTopic = "阴虚潮热与五心烦热病机"; analysisIntent = "病机理解与鉴别辨析"; }
  else if (hints.isYangxu) { analysisTopic = "阳虚低热与阳分伏热机理"; analysisIntent = "病机理解与鉴别辨析"; }
  else if (hints.isFangji) { analysisTopic = "方剂组方配伍与方证对应"; analysisIntent = "方剂组成与配伍机制"; }
  else if (hints.isExam) { analysisTopic = "考点辨析与易错鉴别"; analysisIntent = "考点总结与对比辨析"; }
  else if (hints.isPlan) { analysisTopic = q.slice(0, 18) || "学习计划与阶段目标"; analysisIntent = "学习规划与路径构建"; }

  /* relatedKnowledgeNodes：从预设图谱选 3 条强关联 */
  const relatedKnowledgeNodes = pickRelatedNodes(q, 3);

  /* 结构化提问 prompt：与 engine server.ts structuredPrompt 结构一致 */
  const structuredPrompt = [
    "请从以下结构化维度深入解析：",
    "1. 核心病机机制与脏腑 / 经络 / 气血津液定位？",
    "2. 临床表现特征、节律特点与舌脉鉴别要点？",
    `3. 根据勾选的模式（${outputModes.join("、")}）针对性分层阐述。`,
    "4. 关联方药 / 类方鉴别 / 延伸知识点至少列出 2 组。",
  ];

  return {
    analysis: {
      background: `中医学 / ${studentGrade} / ${currentCourse}`,
      topic: analysisTopic,
      intent: analysisIntent,
      course: currentCourse,
      outputModes,
      structuredPrompt,
      learnerCognitive: userPreference,
    },
    answer: {
      companionGreeting: "你好呀学伴！已按你定制的输出模式生成结构化解答，希望能帮助你理清思维：",
      sections,
      relatedKnowledgeNodes,
    },
    abComparison: {
      unenhancedShortAnswer:
        "这是常见的中医知识点，主要是体内阴阳失调或对应病机造成的，平时多注意休息和清淡饮食，可以参考教材相关章节。",
      comparisonMetrics: {
        accuracyDiff: "+36%",
        completenessDiff: "+52%",
        understandabilityDiff: "+45%",
        knowledgeExpansionDiff: "+65%",
      },
    },
  };
}

/* ========== 五、对外 3 个主要调用入口 ========== */

/* 5.1 引擎健康检查（对应 server.ts GET /api/health）*/
export function healthCheck() {
  return mockResponse(
    () => ({
      status: "ok",
      hasApiKey: false,
      engine: "中医学习问题理解与增强引擎（TCM Question Understanding & Prompt Enhancement Engine） · 前端复刻",
      mode: "pure-frontend",
      presetQuestions: PRESET_QUESTIONS.slice(),
      nineModes: MODE_KEY_LABEL_PAIRS.slice(),
      profile: {
        name: PRESET_STUDENT_PROFILE.name,
        grade: PRESET_STUDENT_PROFILE.grade,
        primaryRole: PRESET_STUDENT_PROFILE.currentReport?.primaryRole || "",
      },
    }),
    100
  );
}

/* 5.2 核心：增强 + 回答（POST /api/enhance-and-answer 前端入口）*/
export async function enhanceAndAnswer({
  question,
  modeKeys,
  modeLabels,
  kind = "qa",
  context,
  forceServer = false,
  provider = "", /* '' | 'kimi' | 'deepseek' */
} = {}) {
  if (!question || typeof question !== "string" || !question.trim()) {
    return mockResponse(() => { throw new Error("问题不能为空"); }, 60);
  }
  const ctx = { ...DEFAULT_ENGINE_CONTEXT, ...(context || {}) };

  /* 用户如果传了 labels 直接用；否则用 keys 映射 */
  let selectedOutputs;
  if (Array.isArray(modeLabels) && modeLabels.length) {
    selectedOutputs = modeLabels.filter((m) => MODE_LABELS.includes(m));
  }
  if (!selectedOutputs || !selectedOutputs.length) {
    selectedOutputs = keysToModeLabels(Array.isArray(modeKeys) ? modeKeys : [], kind);
  }

  const payload = {
    question: String(question).trim(),
    selectedOutputs,
    studentGrade: ctx.studentGrade,
    currentCourse: ctx.currentCourse,
    userPreference: ctx.userPreference,
  };
  if (ctx.studyStats) payload.studyStats = ctx.studyStats;
  if (provider) payload.provider = provider;

  if (forceServer) {
    const server = await callEnhanceServer(payload);
    if (server) return mockResponse(() => server, 60);
  }
  return mockResponse(() => generateLocalStructuredResponse(payload), 380 + Math.round(Math.random() * 220));
}

/* 5.3 引擎 sections -> AnswerView 旧 answerSample sections（heading/bullets）转换 */
export function engineSectionsToAnswerSampleSections(engineSections = []) {
  if (!Array.isArray(engineSections)) return [];
  return engineSections
    .filter((s) => s && (s.title || s.content))
    .map((s) => {
      const heading = (s.mode ? `【${s.mode}】` : "") + (s.title || "要点解析");
      const rawLines = String(s.content || "").split(/\r?\n/).filter(Boolean);
      const bullets = rawLines.map((line) => {
        const txt = line.trim();
        const bold = /^\s*[💡【\[]|【病案】|【病机链路图解】|【水壶煮水模型】|【经典原文】|【核心对证方】|【知识图谱结构】|【历代医家观点】|【现代机制】|【方药拓展】|【相关方药联想】|【病案记录】|【城市管道供水模型】|【油灯与微风模型】|【足球队模型】|【抽屉收纳模型】|【考点图谱】|【组方结构图解】|【近年真题热点】|【核心必考药对】/.test(txt);
        return { text: txt, bold };
      });
      return { heading, bullets };
    });
}

/* ========== 六、规划场景：额外 stages 字段（对应 DeductionTab planning 的 stages） ========== */
export async function enhanceAndPlan({ question, modeKeys, modeLabels, context, forceServer = false, provider = "kimi" } = {}) {
  const base = await enhanceAndAnswer({
    question,
    modeKeys,
    modeLabels,
    kind: "plan",
    context,
    forceServer,
    provider,
  });
  const data = base?.data || {};
  const q = String(question || "");

  const goal = q.trim() || "期末复习《中医诊断学》八纲辨证与舌脉诊断";
  const daysMatch = q.match(/(\d+)\s*(天|周|月)/);
  const duration = daysMatch ? `${daysMatch[1]}${daysMatch[2]}规划` : "7 天规划";

  const defaultStages = [
    {
      day: "阶段一：概念框架与八纲辨证",
      focus: "中基 + 中诊交叉考点",
      tasks: [
        "用【直接精准模式】自测核心病机 10 条",
        "梳理脏腑 / 气血津液 / 经络病位标签",
        "完成《中诊》问诊章节真题 20 道",
      ],
      graphRelation: "关联图谱节点：阴虚潮热、虚热病机（关系强度 0.94）",
    },
    {
      day: "阶段二：舌脉特征与四诊合参",
      focus: "客观体征 + 病案技能",
      tasks: [
        "舌红少苔 vs 舌淡苔白腻对比 20 例",
        "细数脉 / 浮大无力脉 / 滑脉图谱强化",
        "通过【临床案例模式】分析 3 个经典误诊病例",
      ],
      graphRelation: "关联图谱节点：脉细数、舌红少苔（关系强度 0.91）",
    },
    {
      day: "阶段三：跨课程方药映射与配伍",
      focus: "证候 → 治法 → 方剂 → 中药",
      tasks: [
        "阴虚证 → 六味地黄丸 / 知柏地黄丸 三补三泻",
        "气虚发热 → 补中益气汤甘温除大热",
        "方剂同名药对比：半夏厚朴汤 vs 厚朴温中汤",
      ],
      graphRelation: "跨课关联：六味地黄丸（0.92）、补中益气汤（0.95）",
    },
    {
      day: "阶段四：综合模拟与弱项闭环",
      focus: "全真模拟 + 错题回归",
      tasks: [
        "推演板块全真病案推演 1 套",
        "回看认知画像薄弱知识点清单",
        "错题本至少完成 3 遍复现",
      ],
      graphRelation: "全图谱闭环自测",
    },
  ];

  const plan = {
    planMode: /(考研|执业医|医师资格|资格证)/.test(q) ? "exam" : "course",
    target: goal,
    duration,
    studentType: `${context?.studentGrade || DEFAULT_ENGINE_CONTEXT.studentGrade}中医学专业 · ${context?.userPreference || DEFAULT_ENGINE_CONTEXT.userPreference}`,
    stages: defaultStages,
  };

  /* 把 plan 作为额外 section 插入到 answer.sections 顶部 */
  const extraSection = {
    mode: "学习规划",
    title: "阶段规划里程碑",
    content: plan.stages.map((p, i) => {
      const tasks = (p.tasks || []).map((t, j) => `    ${i + 1}.${j + 1} ${t}`).join("\n");
      return `${i + 1}. ${p.day}｜重点：${p.focus}\n${tasks}\n   图谱关联：${p.graphRelation || "无"}`;
    }).join("\n"),
  };

  const mergedSections = [extraSection, ...(data.answer?.sections || [])];
  const merged = {
    ...data,
    plan,
    answer: {
      ...(data.answer || {}),
      companionGreeting: data.answer?.companionGreeting || "已按你的目标生成结构化学习规划，请按阶段稳步推进：",
      sections: mergedSections,
    },
  };

  return { code: base.code || 200, msg: base.msg || "规划生成成功", data: merged };
}

/* 小工具：给定问题 -> 推荐预设问题（用于空状态展示） */
export function recommendPresetQuestions(question = "", limit = 3) {
  const q = String(question || "").trim();
  if (!q) return PRESET_QUESTIONS.slice(0, limit);
  const scored = PRESET_QUESTIONS.slice().map((p) => {
    let s = 0;
    ["title", "question", "tag", "desc"].forEach((k) => {
      const txt = String(p[k] || "");
      if (!txt) return;
      const terms = q.split(/[，。？、\s/,，。？!！：:；;“”""'()（）【】\[\]《》]/).filter((t) => t.length >= 2);
      terms.forEach((t) => { if (txt.includes(t)) s += 2; });
    });
    return { p, s };
  }).sort((a, b) => b.s - a.s);
  return scored.filter((x) => x.s > 0).slice(0, limit).map((x) => x.p).concat(
    scored.filter((x) => x.s === 0).slice(0, limit).map((x) => x.p)
  ).slice(0, limit);
}
