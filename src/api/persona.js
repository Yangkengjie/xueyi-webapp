import { mockResponse } from "./index";

const STORAGE_KEY = "xy-api-persona";
const HISTORY_KEY = "xy-api-persona-history";
const SESSION_KEY = "xy-api-persona-session";

const defaultPersona = {
  axes: ["记忆型", "理解型", "应用型", "分析型"],
  values: [0.75, 0.9, 0.6, 0.8],
  type: "体系构建师",
  description: "理解型得分最高，擅长把知识点连成体系；建议多通过案例与图谱巩固应用能力。",
  strengths: ["知识体系构建能力强", "概念理解深入", "逻辑思维清晰"],
  weaknesses: ["应用实践需加强", "记忆细节可提升"],
  recommendations: ["多做案例分析题", "使用知识图谱建立关联", "定期做记忆强化训练"],
};

const defaultTestHistory = [
  {
    id: "test-001",
    date: "2026-08-10",
    values: [0.72, 0.85, 0.58, 0.78],
    type: "体系构建师",
    totalQuestions: 12,
    duration: 15,
    score: 256,
  },
  {
    id: "test-002",
    date: "2026-07-20",
    values: [0.68, 0.80, 0.55, 0.75],
    type: "体系构建师",
    totalQuestions: 12,
    duration: 18,
    score: 238,
  },
  {
    id: "test-003",
    date: "2026-07-01",
    values: [0.65, 0.78, 0.50, 0.72],
    type: "知识探索者",
    totalQuestions: 12,
    duration: 20,
    score: 225,
  },
];

const TEST_QUESTIONS = [
  {
    id: "q1",
    title: "学习一个新知识点时，你更倾向于：",
    type: "single",
    options: [
      { key: "A", text: "先背诵关键定义，反复记忆", axis: "memory", score: 3 },
      { key: "B", text: "弄清背后的原理和逻辑关系", axis: "understand", score: 3 },
      { key: "C", text: "找一个实际病例或习题来演练", axis: "apply", score: 3 },
      { key: "D", text: "对比多种学说，分析其异同", axis: "analyze", score: 3 },
    ],
  },
  {
    id: "q2",
    title: "面对《伤寒论》这类古籍，你通常：",
    type: "single",
    options: [
      { key: "A", text: "先背诵重要条文，做到心中有数", axis: "memory", score: 3 },
      { key: "B", text: "对照注释理解每一条的原意", axis: "understand", score: 3 },
      { key: "C", text: "结合后世医案看实际如何应用", axis: "apply", score: 3 },
      { key: "D", text: "比较不同注家的观点并做总结", axis: "analyze", score: 3 },
    ],
  },
  {
    id: "q3",
    title: "考试前复习，你最常使用的方法是：",
    type: "single",
    options: [
      { key: "A", text: "速记卡片 + 反复默写高频内容", axis: "memory", score: 3 },
      { key: "B", text: "画思维导图理清章节逻辑", axis: "understand", score: 3 },
      { key: "C", text: "成套刷题并整理错题", axis: "apply", score: 3 },
      { key: "D", text: "按专题横向对比易混淆概念", axis: "analyze", score: 3 },
    ],
  },
  {
    id: "q4",
    title: "遇到无法理解的证候，你会：",
    type: "single",
    options: [
      { key: "A", text: "先记下来，后续再慢慢消化", axis: "memory", score: 2 },
      { key: "B", text: "回到基础理论重新梳理", axis: "understand", score: 3 },
      { key: "C", text: "找同学 / AI 出相似病例练习", axis: "apply", score: 3 },
      { key: "D", text: "横向查阅各家论述做比较", axis: "analyze", score: 3 },
    ],
  },
  {
    id: "q5",
    title: "对方剂组成的记忆，你偏好：",
    type: "single",
    options: [
      { key: "A", text: "背方歌 + 默写组成", axis: "memory", score: 3 },
      { key: "B", text: "理解君臣佐使，按功效联想", axis: "understand", score: 3 },
      { key: "C", text: "看加减变化，结合临床用途", axis: "apply", score: 3 },
      { key: "D", text: "对比同类方的差异，归纳规律", axis: "analyze", score: 3 },
    ],
  },
  {
    id: "q6",
    title: "你认为自己最需要强化的是：",
    type: "single",
    options: [
      { key: "A", text: "琐碎细节的长期记忆", axis: "memory", score: 2 },
      { key: "B", text: "复杂概念的深度理解", axis: "understand", score: 2 },
      { key: "C", text: "面对新病例的灵活应变", axis: "apply", score: 2 },
      { key: "D", text: "多知识点的综合分析", axis: "analyze", score: 2 },
    ],
  },
  {
    id: "q7",
    title: "学习完一个章节后，你会：",
    type: "single",
    options: [
      { key: "A", text: "把重点名词和数据再看一遍", axis: "memory", score: 2 },
      { key: "B", text: "用自己的话复述一遍核心逻辑", axis: "understand", score: 3 },
      { key: "C", text: "立即做几道相关题目验证", axis: "apply", score: 3 },
      { key: "D", text: "和其他章节联系，做横向比较", axis: "analyze", score: 3 },
    ],
  },
  {
    id: "q8",
    title: "对于针灸穴位这类大量数据，你倾向：",
    type: "single",
    options: [
      { key: "A", text: "按经络逐条硬背", axis: "memory", score: 3 },
      { key: "B", text: "理解命名含义 + 主治规律", axis: "understand", score: 3 },
      { key: "C", text: "结合真实病例记忆常用穴", axis: "apply", score: 3 },
      { key: "D", text: "对比同经、同区穴位的差异", axis: "analyze", score: 3 },
    ],
  },
  {
    id: "q9",
    title: "面对错题，你通常：",
    type: "single",
    options: [
      { key: "A", text: "记下正确答案，之后再记", axis: "memory", score: 2 },
      { key: "B", text: "回到课本搞清错的原因", axis: "understand", score: 3 },
      { key: "C", text: "多找几道同类题反复练习", axis: "apply", score: 3 },
      { key: "D", text: "分析是知识漏洞还是方法问题", axis: "analyze", score: 3 },
    ],
  },
  {
    id: "q10",
    title: "你更喜欢的讲解方式是：",
    type: "single",
    options: [
      { key: "A", text: "总结好的要点清单（可直接背诵）", axis: "memory", score: 3 },
      { key: "B", text: "由浅入深、一步步推导", axis: "understand", score: 3 },
      { key: "C", text: "围绕一个真实案例展开", axis: "apply", score: 3 },
      { key: "D", text: "多种观点对比，自己判断", axis: "analyze", score: 3 },
    ],
  },
  {
    id: "q11",
    title: "一周后回顾知识，你更可能：",
    type: "single",
    options: [
      { key: "A", text: "记得大致框架，细节需要再翻书", axis: "understand", score: 2 },
      { key: "B", text: "对具体数据、原文记得更牢", axis: "memory", score: 3 },
      { key: "C", text: "对做过的题目印象最深", axis: "apply", score: 3 },
      { key: "D", text: "对总结出的规律最清晰", axis: "analyze", score: 3 },
    ],
  },
  {
    id: "q12",
    title: "以下描述更符合你的是：",
    type: "single",
    options: [
      { key: "A", text: "熟读唐诗三百首，不会作诗也会吟", axis: "memory", score: 3 },
      { key: "B", text: "知其然，更知其所以然", axis: "understand", score: 3 },
      { key: "C", text: "纸上得来终觉浅，绝知此事要躬行", axis: "apply", score: 3 },
      { key: "D", text: "博学之，审问之，慎思之，明辨之", axis: "analyze", score: 3 },
    ],
  },
];

const TYPE_DESCRIPTIONS = {
  memory: {
    type: "博闻强记者",
    description: "记忆型突出，细节条文掌握扎实；建议结合理解型训练提升灵活应变能力。",
    strengths: ["条文、数据、歌诀记忆出色", "基础细节扎实", "短时间信息摄入强"],
    weaknesses: ["过度依赖机械记忆", "易在灵活应用题上失分"],
    recommendations: ["多做案例应用题", "把知识点用自己的话复述", "适当画图建立关联"],
  },
  understand: {
    type: "体系构建师",
    description: "理解型得分最高，擅长把知识点连成体系；建议多通过案例与图谱巩固应用能力。",
    strengths: ["知识体系构建能力强", "概念理解深入", "逻辑思维清晰"],
    weaknesses: ["应用实践需加强", "记忆细节可提升"],
    recommendations: ["多做案例分析题", "使用知识图谱建立关联", "定期做记忆强化训练"],
  },
  apply: {
    type: "应用实践者",
    description: "应用型得分高，擅长在实际场景中运用知识；建议加强理论基础与分析能力。",
    strengths: ["病例/习题敏感度高", "知识迁移能力强", "实战风格稳定"],
    weaknesses: ["理论体系可能零散", "分析深入度可提高"],
    recommendations: ["回归课本补足理论", "做专题总结形成体系", "加入分析对比训练"],
  },
  analyze: {
    type: "分析思考者",
    description: "分析型突出，擅长归纳对比；建议加强应用场景训练与高频细节记忆。",
    strengths: ["归纳对比能力强", "善于发现规律", "知识网络清晰"],
    weaknesses: ["应试中细节记忆可加强", "应用熟练度可提高"],
    recommendations: ["多刷成套题目", "建立高频考点记忆清单", "结合临床案例学习"],
  },
};

function safeGet(key, def) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return def;
}

function safeSet(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

function readPersona() {
  const raw = safeGet(STORAGE_KEY, null);
  if (raw && typeof raw === "object") return { ...defaultPersona, ...raw };
  return { ...defaultPersona };
}

function writePersona(p) {
  safeSet(STORAGE_KEY, p);
}

function readHistory() {
  const h = safeGet(HISTORY_KEY, null);
  if (Array.isArray(h)) return h;
  return defaultTestHistory.map((d) => ({ ...d }));
}

function writeHistory(h) {
  safeSet(HISTORY_KEY, h);
}

function computeAxisScores(answers) {
  const scores = { memory: 0, understand: 0, apply: 0, analyze: 0 };
  const totals = { memory: 0, understand: 0, apply: 0, analyze: 0 };
  TEST_QUESTIONS.forEach((q) => {
    q.options.forEach((o) => { totals[o.axis] += o.score; });
    const picked = answers[q.id];
    if (!picked) return;
    const opt = q.options.find((o) => o.key === picked);
    if (opt) scores[opt.axis] += opt.score;
  });
  const out = {
    memory: totals.memory ? scores.memory / totals.memory : 0.5,
    understand: totals.understand ? scores.understand / totals.understand : 0.5,
    apply: totals.apply ? scores.apply / totals.apply : 0.5,
    analyze: totals.analyze ? scores.analyze / totals.analyze : 0.5,
  };
  Object.keys(out).forEach((k) => {
    out[k] = Math.max(0.2, Math.min(1, +(0.3 + out[k] * 0.65).toFixed(2)));
  });
  return out;
}

function axisToType(axisScoreMap) {
  const order = ["memory", "understand", "apply", "analyze"];
  let maxKey = "understand";
  let maxVal = -1;
  order.forEach((k) => {
    if (axisScoreMap[k] > maxVal) {
      maxVal = axisScoreMap[k];
      maxKey = k;
    }
  });
  return maxKey;
}

export function getPersona() {
  return mockResponse(() => readPersona(), 350);
}

export function getTestQuestions() {
  return mockResponse(() => {
    const sessionId = "s-" + Date.now();
    safeSet(SESSION_KEY, { id: sessionId, startedAt: Date.now(), answers: {} });
    return { sessionId, total: TEST_QUESTIONS.length, questions: TEST_QUESTIONS };
  }, 300);
}

export function calculatePersona(answers) {
  return mockResponse(() => {
    const axisScores = computeAxisScores(answers || {});
    const typeKey = axisToType(axisScores);
    const values = [axisScores.memory, axisScores.understand, axisScores.apply, axisScores.analyze];
    const desc = TYPE_DESCRIPTIONS[typeKey];
    const totalScore = Math.round(values.reduce((a, b) => a + b * 100, 0));
    return {
      axes: defaultPersona.axes,
      values,
      type: desc.type,
      description: desc.description,
      strengths: desc.strengths,
      weaknesses: desc.weaknesses,
      recommendations: desc.recommendations,
      score: totalScore,
      typeKey,
    };
  }, 300);
}

export function submitPersonaTest(answers, durationSec = 0) {
  return mockResponse(() => {
    const answeredCount = Object.keys(answers || {}).length;
    if (answeredCount < TEST_QUESTIONS.length) {
      throw new Error(`请完成全部 ${TEST_QUESTIONS.length} 道题目`);
    }
    const calcRes = calculatePersonaSync(answers);
    const updated = {
      ...readPersona(),
      axes: calcRes.axes,
      values: calcRes.values,
      type: calcRes.type,
      description: calcRes.description,
      strengths: calcRes.strengths,
      weaknesses: calcRes.weaknesses,
      recommendations: calcRes.recommendations,
      lastTestAt: Date.now(),
    };
    writePersona(updated);

    const history = readHistory();
    history.unshift({
      id: "test-" + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      values: updated.values,
      type: updated.type,
      totalQuestions: TEST_QUESTIONS.length,
      duration: Math.max(1, Math.round(durationSec / 60)),
      score: calcRes.score,
    });
    writeHistory(history);

    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}

    return { persona: updated, historyItem: history[0], score: calcRes.score };
  }, 500);
}

function calculatePersonaSync(answers) {
  const axisScores = computeAxisScores(answers || {});
  const typeKey = axisToType(axisScores);
  const values = [axisScores.memory, axisScores.understand, axisScores.apply, axisScores.analyze];
  const desc = TYPE_DESCRIPTIONS[typeKey];
  const totalScore = Math.round(values.reduce((a, b) => a + b * 100, 0));
  return {
    axes: defaultPersona.axes,
    values,
    type: desc.type,
    description: desc.description,
    strengths: desc.strengths,
    weaknesses: desc.weaknesses,
    recommendations: desc.recommendations,
    score: totalScore,
    typeKey,
  };
}

export function retakePersonaTest() {
  return mockResponse(() => {
    const base = readPersona();
    const newValues = base.values.map((v) => {
      const delta = (Math.random() - 0.4) * 0.1;
      return Math.max(0.3, Math.min(1, +(v + delta).toFixed(2)));
    });
    const keyMap = { 0: "memory", 1: "understand", 2: "apply", 3: "analyze" };
    const maxIdx = newValues.indexOf(Math.max(...newValues));
    const desc = TYPE_DESCRIPTIONS[keyMap[maxIdx]] || TYPE_DESCRIPTIONS.understand;
    const updated = {
      ...base,
      values: newValues,
      type: desc.type,
      description: desc.description,
      strengths: desc.strengths,
      weaknesses: desc.weaknesses,
      recommendations: desc.recommendations,
      lastTestAt: Date.now(),
    };
    writePersona(updated);

    const history = readHistory();
    history.unshift({
      id: "test-" + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      values: newValues,
      type: updated.type,
      totalQuestions: TEST_QUESTIONS.length,
      duration: Math.floor(10 + Math.random() * 20),
      score: Math.round(newValues.reduce((a, b) => a + b * 100, 0)),
    });
    writeHistory(history);

    return updated;
  }, 1200);
}

export function getPersonaHistory() {
  return mockResponse(() => readHistory(), 300);
}

export function getTestSession() {
  return mockResponse(() => safeGet(SESSION_KEY, null), 100);
}
