/* tutor API：把「Tutor 答疑 / 规划」「AnswerView 重新生成 / 追问」
   和「提示词增强引擎 promptEngine.js」接到一起；
   保持与原有 mock 行为兼容（不引入真实网络请求时，仍能返回结构化答案）
*/

import * as promptEngine from "./promptEngine";
import { labelsToModeKeys } from "./promptEngine";
import * as settingsApi from "./settings";
import * as personaApi from "./persona";
import { mockResponse } from "./index";

/* 会话桶：存每一次 engine 的完整原始输出，以便 AnswerView 再次加载时能复用
   key: sessionId（a1 / a2 / ... / p1 / p2 ...）*/
const SESSION_BUCKET_KEY = "xy-tutor-sessions-v1";

function safeGet(key, def) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : def;
  } catch (e) {
    return def;
  }
}
function safeSet(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

/* 根据 settings.answerStyles 构建 engine 入参里的 modeKeys + 上下文 */
async function buildEngineRuntime(kind = "qa") {
  let answerStyles = ["guide"];
  try {
    const s = await settingsApi.getSettings();
    if (s?.code === 200 && Array.isArray(s?.data?.settings?.answerStyles)) {
      answerStyles = s.data.settings.answerStyles.slice();
    }
  } catch (_) { /* ignore */ }

  /* 从 persona 获取学生年级 / 当前主修课程；拿不到就用默认 */
  let studentGrade = promptEngine.DEFAULT_ENGINE_CONTEXT.studentGrade;
  let currentCourse = promptEngine.DEFAULT_ENGINE_CONTEXT.currentCourse;
  let userPreference = promptEngine.DEFAULT_ENGINE_CONTEXT.userPreference;
  try {
    const p = await personaApi.getPersona();
    const pr = p?.code === 200 ? p.data : null;
    if (pr?.profile?.grade) studentGrade = pr.profile.grade;
    if (pr?.profile?.focusArea) currentCourse = pr.profile.focusArea;
    if (pr?.profile?.learningStyle) userPreference = pr.profile.learningStyle;
  } catch (_) { /* ignore */ }

  /* QA 没勾选就给默认 4 项，规划没勾选给默认 3 项，保证总有输出
     注意：settings answerStyles 存 key 数组，默认 LABELS 需要 labelsToModeKeys 转成 key 再统一走 modeKeys */
  const defaultKeys = kind === "plan"
    ? labelsToModeKeys(promptEngine.DEFAULT_PLAN_MODE_LABELS)
    : labelsToModeKeys(promptEngine.DEFAULT_QA_MODE_LABELS);
  const modes = answerStyles && answerStyles.length
    ? answerStyles
    : defaultKeys;

  return {
    modeKeys: modes,
    context: { studentGrade, currentCourse, userPreference },
  };
}

/* ---- 对外 API 与原先 Answer 路由参数兼容 ---- */

/* 问答：给出 question + 图片，返回 sessionId + 引擎原始完整 output + answerSample 结构
   返回 data：{
     sessionId, mode: 'qa'|'plan', question, images,
     engine: 原始 engine 输出（analysis/answer/abComparison）,
     answerSample：给 AnswerView 旧结构（sections:heading+bullets）直接渲染用,
     createdAt
   }
*/
export async function askTutorQA({ text, images }) {
  if (!text || !String(text).trim()) {
    throw new Error("请先输入问题");
  }
  const question = String(text).trim();
  const { modeKeys, context } = await buildEngineRuntime("qa");
  const res = await promptEngine.enhanceAndAnswer({
    question, modeKeys, kind: "qa", context, forceServer: true,
  });
  if (!res || res.code !== 200) {
    throw new Error(res?.msg || "生成答案失败，请重试");
  }
  const engine = res.data;
  const answerSample = {
    title: question,
    sections: promptEngine.engineSectionsToAnswerSampleSections(engine?.answer?.sections || []),
    /* 额外把 analysis/companionGreeting 塞到 answerSample 顶部，AnswerView 可按需展示 */
    _meta: {
      companionGreeting: engine?.answer?.companionGreeting || "",
      analysis: engine?.analysis || null,
      relatedKnowledgeNodes: engine?.answer?.relatedKnowledgeNodes || [],
      abComparison: engine?.abComparison || null,
    },
  };

  const sessionId = "a" + Date.now().toString(36);
  const saved = {
    sessionId,
    mode: "qa",
    question,
    images: Array.isArray(images) ? images : [],
    engine,
    answerSample,
    createdAt: new Date().toISOString(),
  };
  const bucket = safeGet(SESSION_BUCKET_KEY, {});
  bucket[sessionId] = saved;
  safeSet(SESSION_BUCKET_KEY, bucket);
  return saved;
}

/* 规划：给出 question（如 "2026 年考研中医综合 8 个月复习计划"），返回同结构，kind=plan */
export async function askTutorPlan({ text }) {
  if (!text || !String(text).trim()) {
    throw new Error("请先输入规划目标");
  }
  const question = String(text).trim();
  const { modeKeys, context } = await buildEngineRuntime("plan");
  const res = await promptEngine.enhanceAndPlan({ question, modeKeys, context, forceServer: true });
  if (!res || res.code !== 200) {
    throw new Error(res?.msg || "生成规划失败，请重试");
  }
  const engine = res.data;
  const planSections = engine?.plan?.phases?.length
    ? [{ mode: "阶段规划", title: "学习计划里程碑", content: engine.plan.phases.map((p, i) => `${i + 1}. ${p.title}｜时长：${p.duration}｜重点：${p.focus}`).join("\n") }, ...(engine?.answer?.sections || [])]
    : (engine?.answer?.sections || []);
  const answerSample = {
    title: question,
    sections: promptEngine.engineSectionsToAnswerSampleSections(planSections),
    _meta: {
      companionGreeting: engine?.answer?.companionGreeting || "",
      analysis: engine?.analysis || null,
      relatedKnowledgeNodes: engine?.answer?.relatedKnowledgeNodes || [],
      abComparison: engine?.abComparison || null,
      plan: engine?.plan || null,
    },
  };
  const sessionId = "p" + Date.now().toString(36);
  const saved = {
    sessionId,
    mode: "plan",
    question,
    images: [],
    engine,
    answerSample,
    createdAt: new Date().toISOString(),
  };
  const bucket = safeGet(SESSION_BUCKET_KEY, {});
  bucket[sessionId] = saved;
  safeSet(SESSION_BUCKET_KEY, bucket);
  return saved;
}

/* 获取会话详情：AnswerView 按路由 params.id 加载 */
export async function getTutorSession(sessionId) {
  if (!sessionId) {
    return mockResponse(() => null, 40);
  }
  return mockResponse(() => {
    const bucket = safeGet(SESSION_BUCKET_KEY, {});
    return bucket[sessionId] || null;
  }, 120);
}

/* 重新生成某会话：重新跑一次 engine，但保留相同 question/images；返回新 answerSample */
export async function regenerateTutorSession(sessionId) {
  if (!sessionId) throw new Error("缺少会话 ID");
  const bucket = safeGet(SESSION_BUCKET_KEY, {});
  const prev = bucket[sessionId];
  if (!prev) throw new Error("会话不存在，请回到导师页重新提问");
  const regenerated = prev.mode === "plan"
    ? await askTutorPlan({ text: prev.question })
    : await askTutorQA({ text: prev.question, images: prev.images });
  /* 沿用旧 sessionId，避免路由跳转；把新内容写回去，保留历史 createdAt */
  regenerated.sessionId = prev.sessionId;
  regenerated.createdAt = prev.createdAt;
  regenerated.regeneratedAt = new Date().toISOString();
  bucket[prev.sessionId] = regenerated;
  safeSet(SESSION_BUCKET_KEY, bucket);
  return regenerated;
}

/* 继续追问：在原会话上追加一轮新的 QA，合并到 answerSample.sections 末尾，并写回桶 */
export async function followUpTutorSession({ sessionId, text }) {
  if (!sessionId) throw new Error("缺少会话 ID");
  if (!text || !String(text).trim()) throw new Error("请输入追问内容");
  const bucket = safeGet(SESSION_BUCKET_KEY, {});
  const prev = bucket[sessionId];
  if (!prev) throw new Error("会话不存在，请回到导师页重新提问");

  const question = String(text).trim();
  const { modeKeys, context } = await buildEngineRuntime("qa");
  const res = await promptEngine.enhanceAndAnswer({
    question, modeKeys, kind: "qa", context, forceServer: true,
  });
  if (!res || res.code !== 200) throw new Error(res?.msg || "追问失败，请重试");
  const engine = res.data;
  const followSections = promptEngine.engineSectionsToAnswerSampleSections(engine?.answer?.sections || []);
  const newSections = [
    ...(prev.answerSample?.sections || []),
    { heading: `【追问】${question}`, bullets: [{ text: engine?.answer?.companionGreeting || "", bold: true }] },
    ...followSections,
  ];
  const merged = {
    ...prev,
    answerSample: {
      ...(prev.answerSample || {}),
      sections: newSections,
      _meta: {
        ...(prev.answerSample?._meta || {}),
        lastFollowUp: {
          question,
          analysis: engine?.analysis || null,
          at: new Date().toISOString(),
        },
      },
    },
    engine: engine, // 保存"最后一轮"引擎输出，便于调试
  };
  bucket[sessionId] = merged;
  safeSet(SESSION_BUCKET_KEY, bucket);
  return merged;
}
