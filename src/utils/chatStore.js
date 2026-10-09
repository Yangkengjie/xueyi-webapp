const STORAGE_KEY = "xueyi-chat-conversations-v1";

const now = () => new Date();

const pad = (n) => String(n).padStart(2, "0");

const formatTime = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const dateKey = (date) => {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
};

const readAll = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeAll = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const makeId = () => `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const clone = (value) => JSON.parse(JSON.stringify(value));

export const createConversation = ({ question, mode = "qa" } = {}) => {
  const date = now();
  return {
    id: makeId(),
    mode,
    title: question || (mode === "plan" ? "我的备考目标" : "图片提问"),
    createdAt: date.toISOString(),
    updatedAt: date.toISOString(),
    messages: [],
  };
};

export const addMessage = (conversation, role, content, extra = {}) => {
  const date = now();
  conversation.messages.push({
    id: `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    role,
    content,
    time: formatTime(date),
    ...extra,
  });
  conversation.updatedAt = date.toISOString();
};

export const replaceMessage = (conversation, messageId, content, extra = {}) => {
  const message = conversation.messages.find((item) => item.id === messageId);
  if (!message) return false;
  message.content = content;
  Object.assign(message, extra);
  conversation.updatedAt = now().toISOString();
  return true;
};

export const saveConversation = (conversation) => {
  const all = readAll();
  const index = all.findIndex((item) => item.id === conversation.id);
  const value = clone(conversation);
  if (index >= 0) all[index] = value;
  else all.unshift(value);
  all.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  writeAll(all);
  return value;
};

export const getConversation = (id) => readAll().find((item) => item.id === id) || null;

export const getConversations = () => readAll().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

export const clearConversations = () => localStorage.removeItem(STORAGE_KEY);

const ANSWER_STYLE_KEY = "xy-answer-styles";

export const getActiveAnswerStyles = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(ANSWER_STYLE_KEY) || '["A"]');
    const allowed = new Set(["A", "B", "C", "D", "E", "F", "G", "H", "I"]);
    const styles = Array.isArray(raw) ? raw.filter((key) => allowed.has(key)) : [];
    return styles.length ? styles : ["A"];
  } catch {
    return ["A"];
  }
};

const cloneAnswer = (value) => JSON.parse(JSON.stringify(value));

const normalizeTextKey = (value) => String(value || "")
  .replace(/\s+/g, " ")
  .replace(/[\r\n]+/g, " ")
  .trim();

// 最终回答统一去重：
// 1. 同名章节只保留一个；
// 2. 同一条正文只出现一次；
// 3. 空章节不会输出。
const dedupeAnswer = (answer) => {
  const sectionMap = new Map();
  const seenBullets = new Set();

  for (const section of answer?.sections || []) {
    const heading = String(section?.heading || "").trim();
    if (!heading) continue;

    const headingKey = normalizeTextKey(heading);
    if (!sectionMap.has(headingKey)) {
      sectionMap.set(headingKey, { heading, bullets: [] });
    }

    const target = sectionMap.get(headingKey);
    for (const bullet of Array.isArray(section?.bullets) ? section.bullets : []) {
      const text = String(bullet || "").trim();
      const key = normalizeTextKey(text);
      if (!key || seenBullets.has(key)) continue;
      seenBullets.add(key);
      target.bullets.push(text);
    }
  }

  return {
    ...answer,
    sections: [...sectionMap.values()].filter((section) => section.bullets.length),
  };
};

const applyAnswerStyles = (answer, question, styles = getActiveAnswerStyles()) => {
  const q = (question || "这个问题").trim();

  // 核心答案只克隆一次。风格模块只能追加“自身内容”，不能重新生成基础答案。
  const result = cloneAnswer(answer);
  const selected = new Set(Array.isArray(styles) ? styles : []);
  const styleSections = [];

  const addStyleSection = (heading, bullets) => {
    styleSections.push({ heading, bullets });
  };

  if (selected.has("B")) {
    addStyleSection("三、引导思考", [
      `如果把“${q}”拆开理解，你认为最需要先判断的是“概念是什么”，还是“它为什么会发生”？`,
      "可以先根据已有信息自己做一个判断，再继续追问，我会结合你的思路逐步分析。",
    ]);
  }

  if (selected.has("C")) {
    addStyleSection("知识结构", [
      `问题：${q} → 基本概念 → 相关因素 → 相互关系 → 辨证/应用`,
      "学习时可以先建立主干，再把症状、病机、治法等内容逐步挂接到对应节点。",
    ]);
  }

  if (selected.has("D")) {
    addStyleSection("案例推演（示例）", [
      `假设学习者遇到与“${q}”相关的题目，应先提取题干中的主要线索，再结合整体表现判断，不宜只凭单一关键词直接下结论。`,
      "当前为离线演示案例结构，不代表真实患者，也不构成医疗诊断或处方建议。",
    ]);
  }

  if (selected.has("E")) {
    addStyleSection("通俗理解", [
      "可以把复杂关系理解成一个需要保持平衡的系统：某一部分变化，往往会带动其他部分发生相应调整，因此不能孤立地看待单个现象。",
    ]);
  }

  if (selected.has("F")) {
    addStyleSection("古籍溯源提示", [
      "当前离线 Mock 阶段不接入古籍原文数据库，因此不会伪造原文或出处。接入知识库后，可在这里返回对应原文、篇名和出处。",
    ]);
  }

  if (selected.has("G")) {
    addStyleSection("学说对照框架", [
      "后续可从不同医家或不同理论体系的共同点、分歧点和适用场景三个角度进行对照学习。",
    ]);
  }

  if (selected.has("H")) {
    addStyleSection("现代研究提示", [
      "当前离线 Mock 阶段未连接文献检索服务，因此不虚构研究结论。接入真实服务后，可在这里展示对应研究摘要和来源。",
    ]);
  }

  if (selected.has("I")) {
    addStyleSection("方药分析框架", [
      "可按“辨证依据 → 治法思路 → 方药组成 → 配伍关系 → 加减原则”逐步展开；当前离线演示不根据单一问题直接生成具体处方。",
    ]);
  }

  // A 是“直接精准模式”，只影响基础回答的简洁程度，因此不额外追加重复章节。
  result.sections = [...(result.sections || []), ...styleSections];
  return dedupeAnswer(result);
};

const buildBaseMockAnswer = (question, mode = "qa") => {
  const q = (question || "").trim();

  if (mode === "plan") {
    return {
      sections: [
        {
          heading: "第一阶段：夯实基础（7天）",
          bullets: [
            `围绕“${q || "中医基础理论"}”梳理核心知识，每天学习 60～90 分钟。`,
            "完成章节基础练习，并整理 3～5 个易错知识点。",
          ],
        },
        {
          heading: "第二阶段：强化联系（7天）",
          bullets: [
            "结合知识图谱复习知识点之间的关系，建立从概念到病机、治法的联系。",
            "每天完成一组辨证练习，重点记录错误原因。",
          ],
        },
        {
          heading: "第三阶段：模拟巩固（7天）",
          bullets: [
            "进行综合题和错题回顾，按照薄弱知识点安排二次复习。",
            "最后两天进行完整模拟，并根据结果调整复习重点。",
          ],
        },
      ],
    };
  }

  // 具体问题要放在通用关键词之前，否则“阴阳失调”会被“阴阳”规则提前命中。
  if (/阴阳.*(失调|失衡|偏盛|偏衰)|失调.*阴阳|阴阳.*有哪些表现|阴阳失调/.test(q)) {
    return {
      sections: [
        {
          heading: "一、阴阳失调的主要表现",
          bullets: [
            "阴阳失调是人体阴阳之间的消长、制约关系失常，临床上常表现为阴阳偏盛、偏衰或阴阳互损。",
            "阴盛或阳虚多可见寒象，如畏寒肢冷、面色淡白、喜温等；阳盛或阴虚则多可见热象，如发热、口渴、潮热、盗汗等。",
          ],
        },
        {
          heading: "二、辨证时如何判断",
          bullets: [
            "判断阴阳失调不能只看单个症状，还需要结合寒热、虚实、舌象、脉象以及病程进行综合分析。",
            "例如同样出现怕冷，既可能属于阳虚，也可能是寒邪偏盛，因此还要进一步辨别病因和虚实。",
          ],
        },
      ],
    };
  }

  if (/什么是阴阳|阴阳的基本概念|阴阳是什么/.test(q)) {
    return {
      sections: [
        {
          heading: "一、阴阳的基本概念",
          bullets: [
            "阴阳是认识和解释自然界以及人体生命活动中对立统一关系的一对基本概念。",
            "在人体中，阴多指具有滋润、宁静、抑制等特性的物质和功能；阳多指温煦、推动、兴奋等特性。",
          ],
        },
        {
          heading: "二、阴阳之间的关系",
          bullets: [
            "阴阳相互制约、相互依存，并且在一定条件下可以相互转化。",
            "临床辨证时，需要结合寒热、虚实等表现判断阴阳盛衰，而不能孤立理解。",
          ],
        },
      ],
    };
  }

  if (/什么是五行|五行是什么|五行的基本概念/.test(q)) {
    return {
      sections: [
        {
          heading: "一、五行的基本概念",
          bullets: [
            "五行是木、火、土、金、水五种基本物质及其运动变化的概括，中医学借此说明人体脏腑之间以及人与自然之间的联系。",
            "五行并不是简单指五种具体物质，而是一套用于认识事物属性、相互关系和变化规律的理论。",
          ],
        },
        {
          heading: "二、五行之间的关系",
          bullets: [
            "五行之间主要通过生、克关系保持动态平衡，即木生火、火生土、土生金、金生水、水生木；同时存在木克土、土克水、水克火、火克金、金克木。",
            "中医临床常借助五行生克理论分析脏腑之间的相互影响，并辅助理解病理传变和治疗原则。",
          ],
        },
      ],
    };
  }

  if (/湿疹|湿热|皮肤/.test(q)) {
    return {
      sections: [
        {
          heading: "一、从病因病机理解",
          bullets: [
            "湿疹相关表现可以从湿邪、热邪、风邪以及脾失健运等方面进行分析。",
            "湿邪黏滞，郁久可以化热；湿热蕴于肌肤时，可出现红、肿、瘙痒、渗出等表现。",
          ],
        },
        {
          heading: "二、辨证时需要注意",
          bullets: [
            "还需要结合皮损特点、病程、舌脉以及伴随症状进行辨证，不能仅凭一个症状判断证型。",
            "如果你提供具体症状、舌象或相关检查信息，可以继续进行更具体的辨证分析。",
          ],
        },
      ],
    };
  }

  return {
    sections: [
      {
        heading: "一、问题分析",
        bullets: [
          `关于“${q || "这个问题"}”，可以先从概念、病因病机和临床表现三个层面理解。`,
          "中医学习时建议把经典条文、病机和辨证联系起来，不要只记孤立结论。",
        ],
      },
      {
        heading: "二、进一步学习",
        bullets: [
          "可以结合相关知识点和经典原文继续追问，我会在当前会话中保留上下文。",
          "如果你提供具体症状、条文或题目，我可以继续按这个问题展开分析。",
        ],
      },
    ],
  };
};

export const buildMockAnswer = (question, mode = "qa", styles = getActiveAnswerStyles()) =>
  applyAnswerStyles(buildBaseMockAnswer(question, mode), question, styles);

export const seedLegacyHistory = () => {
  if (getConversations().length) return;
  // 旧版页面已有一组演示历史；不把它们写入可编辑会话，避免污染用户真实历史。
};

export const formatHistoryGroups = (conversations) => {
  const groups = new Map();
  const today = dateKey(now());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = dateKey(yesterdayDate);

  for (const conversation of conversations) {
    const date = new Date(conversation.updatedAt);
    const key = dateKey(date);
    let label;
    if (key === today) label = "今天";
    else if (key === yesterday) label = "昨天";
    else label = `${date.getMonth() + 1}.${date.getDate()}`;

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(conversation);
  }

  return Array.from(groups.entries()).map(([group, items]) => ({ group, items }));
};
