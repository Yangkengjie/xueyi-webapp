/* ============================================================
 * 学医智用 · 全局图标映射（唯一真源）
 * 所有系统图标只在这里定义：相同功能在不同页面必须只走这里一个 key。
 * 不处理用户评论、正文等内容中的自然 Emoji。
 *
 * 三大组件分区：
 *  1) BaseAppIcon: 通用功能（刷新 / 历史 / 加按钮 / 搜索 / 报告标题 / 建议星 …）
 *  2) ReportIcon: 报告类型（日报/周报/月报），统一图案
 *  3) CourseIcon: 课程图案 + 主题色（收敛彩虹色）
 *  （AchievementIcon / AchievementCategoryIcon 仍放在 achievementIcons.js，不重复）
 *
 * 配色规范：
 *  - 通用图标线条：--color-primary #266636；未选中灰绿色 #6a8f78
 *  - 课程主题色统一使用 4 色档：墨绿 / 灰绿 / 青灰 / 米黄（极低饱和同色系明暗）
 *    不再用之前的 12 色渐变。渐变只允许 light 作为极淡的同色系。
 *  - 课程色只作为卡片极淡背景 + 12% 主色叠加，不再形成彩虹墙。
 * ============================================================ */

/* ---------- 1. 通用功能图标（内联 SVG，viewBox 24） ---------- */
export const BASE_ICON_SVGS = {
  // 刷新（箭头圆环）
  refresh: /*html*/`
    <path d="M20 12a8 8 0 1 1-2.34-5.66" />
    <path d="M20 4v5h-5" />
  `,
  // 历史（时钟 + 回退箭头）
  history: /*html*/`
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
    <path d="M3 3l4 3" />
  `,
  // 加号
  plus: /*html*/`
    <path d="M12 5v14M5 12h14" />
  `,
  // 关闭（小 ×，不要粗）
  close: /*html*/`
    <path d="M6 6l12 12M18 6L6 18" />
  `,
  // 学习历程 / 导航标识（圆+问号简化版；用于学习状态小按钮）
  journey: /*html*/`
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.1.8-1.1 1.8" />
    <circle cx="12" cy="17" r="0.5" fill="currentColor" />
  `,
  // 报告标题（折线 + 左角）— 学习报告 section head 用
  reportHead: /*html*/`
    <path d="M3 3v18h18" />
    <path d="M7 15l4-4 4 4 5-7" />
  `,
  // 学习状态（小线图，保持简洁）
  statusHead: /*html*/`
    <path d="M3 17l5-6 4 3 6-8 3 4" />
  `,
  // 今日建议：星（6 角，避免闪光 Emoji）
  adviceStar: /*html*/`
    <path d="M12 4l1.6 3.6L17.6 8.6l-3.2 2.8.8 4-3.2-2-3.2 2 .8-4-3.2-2.8L10.4 7.6Z" />
  `,
  // 通用"查看/下一页/展开箭头"（小 ›› ）
  goArrow: /*html*/`
    <path d="M9 6l6 6-6 6" />
  `,
  // 雷达/个人画像（小圆+3 轴，不要🎯）
  persona: /*html*/`
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 3.4V20.6M4.5 7.8L19.5 16.2M4.5 16.2L19.5 7.8" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
  `,
  // 登录/用户（轮廓）
  user: /*html*/`
    <circle cx="12" cy="8.4" r="3.4" />
    <path d="M5.4 19.6C6.8 16.8 9.2 15 12 15s5.2 1.8 6.6 4.6" />
  `,
  // AI 答疑（气泡 + 小圈，保持与分类 ai 类似，但尺寸小）
  tutorBubble: /*html*/`
    <path d="M5 7.4H15.4A1.6 1.6 0 0 1 17 9v5a1.6 1.6 0 0 1-1.6 1.6H11L8 20V15.6H5A1.6 1.6 0 0 1 3.4 14V9A1.6 1.6 0 0 1 5 7.4Z" />
    <circle cx="8.4" cy="11.6" r="0.9" fill="currentColor" />
    <circle cx="12" cy="11.6" r="0.9" fill="currentColor" />
    <circle cx="15" cy="11.6" r="0.9" fill="currentColor" />
  `,
  // 知识速查（放大镜+书页小角）
  quickSearch: /*html*/`
    <circle cx="11" cy="11" r="6.4" />
    <path d="M15.8 15.8L20.4 20.4" />
    <path d="M8 8.8h4.4M8 11.2h3" />
  `,
  // 收藏（书签）
  fav: /*html*/`
    <path d="M6 3.8h12v16.4l-6-4-6 4V3.8Z" />
  `,
  // 设置（齿轮，保持 8 齿对称，细线）
  settings: /*html*/`
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13.4l2-1.4-2-3.4-2.4.8c-.6-.6-1.2-1-2-1.2l-.8-2.4h-4l-.8 2.4c-.8.2-1.4.6-2 1.2l-2.4-.8-2 3.4 2 1.4c0 .6 0 1.2 0 2l-2 1.4 2 3.4 2.4-.8c.6.6 1.2 1 2 1.2l.8 2.4h4l.8-2.4c.8-.2 1.4-.6 2-1.2l2.4.8 2-3.4-2-1.4c0-.6 0-1.2 0-2Z" />
  `,
  // 学习墙统计（学习课程图标：书+3 点）
  statCourse: /*html*/`
    <path d="M5 5h10a2 2 0 0 1 2 2v12H7a2 2 0 0 1-2-2V5Z" />
    <path d="M5 9h12M8 7.2h2M8 11.2h4" />
  `,
  // 学习墙统计（知识点：节点+连线，不要⭐）
  statKp: /*html*/`
    <circle cx="12" cy="6" r="2" />
    <circle cx="5.6" cy="14" r="2" />
    <circle cx="18.4" cy="14" r="2" />
    <path d="M12 8v3.6M10.4 12.8L7.4 13.4M13.6 12.8L16.6 13.4" />
  `,
  // 复习（循环箭头，不要⏰）
  review: /*html*/`
    <path d="M21 12a9 9 0 1 1-3.2-6.8" />
    <path d="M21 4v5h-5" />
  `,
  // 任务（勾选框）
  task: /*html*/`
    <rect x="4.2" y="4.2" width="15.6" height="15.6" rx="2.6" />
    <path d="M8.2 12L10.6 14.4 16 9.8" />
  `,
  // 最近获得 / 成就标题：火（保持极淡线条；不做火焰渐变）
  recentFlame: /*html*/`
    <path d="M12 3.6c1.2 3 0 4.4-1 6c-1.2 2-.2 3.6 1 3.6 1.4 0 2.6 1.4 2 3C15 20.8 12.2 21.4 12 19.2 11.8 21 9 21.4 8 18.2c-.6-1.4 0-2.8 1-3 .4-1.4-1.2-2-1-3.8C8.4 9 9.8 7.6 10 6c0 .8 1 2 2-2.4Z" />
  `,
};

export const BASE_ICON_KEYS = Object.keys(BASE_ICON_SVGS);

/* ---------- 2. 报告图标（日报 / 周报 / 月报） ---------- */
export const REPORT_ICON_SVGS = {
  daily: /*html*/`
    <rect x="4.6" y="4.6" width="14.8" height="14.8" rx="2.4" />
    <path d="M8.4 3.4V6.6M15.6 3.4V6.6M4.6 10.4h14.8" />
    <circle cx="12" cy="14.6" r="1.8" />
  `,
  weekly: /*html*/`
    <rect x="4.6" y="5.2" width="14.8" height="13.6" rx="2" />
    <path d="M4.6 9h14.8" />
    <path d="M7.2 17.2V12.2M9.8 17.2v-4M12.4 17.2v-6M15 17.2v-2.8M17 17.2v-5" />
  `,
  monthly: /*html*/`
    <rect x="3.8" y="4.6" width="16.4" height="14.8" rx="2.2" />
    <path d="M3.8 8.6h16.4" />
    <path d="M6.4 11.4h1.2M10 11.4h1.2M13.6 11.4h1.2M17.2 11.4h.6M6.4 14.2h1.2M10 14.2h1.2M13.6 14.2h1.2M17.2 14.2h.6" />
    <path d="M6.4 17.2h12" />
    <path d="M8.4 3.4v3.4M15.6 3.4v3.4" />
  `,
};

export const REPORT_ICON_KEYS = Object.keys(REPORT_ICON_SVGS);

/* ---------- 3. 课程图标（SHAPE） + 主题色（收敛同色系） + 别名（中医/中医基础/中医诊断 等） ---------- */
/* 形状：全部 24×24 线性，墨绿主体，收敛不花哨。 */
export const COURSE_SHAPE_SVGS = {
  acupoint: /*html*/`
    <path d="M7.2 17L17 7.2" />
    <path d="M7.4 7.4L17.2 17" transform="translate(0.2 -0.2) rotate(15 12 12)" />
    <circle cx="7.2" cy="8" r="1" fill="currentColor" />
    <circle cx="17" cy="7" r="1" fill="currentColor" />
    <circle cx="17.2" cy="16.8" r="1" fill="currentColor" />
    <circle cx="8.2" cy="16" r="1" fill="currentColor" />
  `,
  shanghan: /*html*/`
    <path d="M4.2 6.6h7.8h7.8c.6 0 1 .4 1 1v10.2c0 .6-.4 1-1 1h-7.8h-7.8c-.6 0-1-.4-1-1V7.6c0-.6.4-1 1-1Z" />
    <path d="M12 6.6v12.2" />
    <path d="M7.2 10.6h3.6M7.2 13.2h2.4M13.8 10.6h3.6M13.8 13.2h2.4" />
    <path d="M5.2 17.2c1.8-1.2 3.2 0.2 5-1.2C9 16.6 10.4 15.4 11.6 15" />
  `,
  formula: /*html*/`
    <rect x="4.4" y="5" width="12.8" height="14" rx="1.6" />
    <path d="M4.4 8.2h12.8" />
    <path d="M7.4 11h7.8M7.4 13.2h4.8" />
    <path d="M17 3.4c-.8-1.4-2.8 0-3 1.4" />
    <path d="M8.2 4.8C9.2 3.6 10.8 5 11 6.6" />
  `,
  diagnose: /*html*/`
    <path d="M5.4 15.8h13.2" />
    <path d="M7 15.8V12c0-1.4 1-2.4 2.4-2.4h5.2c1.4 0 2.4 1 2.4 2.4v3.8" />
    <path d="M11 13.4c.2 1.2 2 1.2 2 0" />
    <circle cx="12" cy="8.2" r="1" fill="currentColor" />
    <path d="M10 7c.4-1.2 2.2-1.4 3.2-.4" />
    <circle cx="8.4" cy="6.2" r="0.6" fill="currentColor" />
    <circle cx="15.6" cy="6.2" r="0.6" fill="currentColor" />
  `,
  wenbing: /*html*/`
    <path d="M4.2 6.6h15.2c.6 0 1 .4 1 1v10.2c0 .6-.4 1-1 1H4.2c-.6 0-1-.4-1-1V7.6c0-.6.4-1 1-1Z" />
    <path d="M4.2 10.8h15.2" />
    <path d="M7 14.2c1-1.6 2.4-.2 3.4-1.6 1.2 1.4 2.6 0 3.8 1.6 1.2-1.4 2.6 0 3 1.4" />
    <path d="M6.8 17.6c1-1.6 2.4-.2 3.4-1.6 1.2 1.4 2.6 0 3.8 1.6 1.2-1.4 2.6 0 3 1.4" transform="translate(0 0.8)" />
  `,
  tcmBasic: /*html*/`
    <circle cx="12" cy="8" r="3.6" />
    <path d="M12 4.4v7.2M8.4 8h7.2" />
    <path d="M4.6 18.6h14.8" />
    <path d="M5.8 14.6h12.4v4H5.8z" />
    <path d="M5.8 16.8h12.4M8 14.6v4M16 14.6v4" />
  `,
  neijing: /*html*/`
    <path d="M4.2 6.2h7.8h7.8c.6 0 1 .4 1 1v11c0 .6-.4 1-1 1h-7.8h-7.8c-.6 0-1-.4-1-1v-11c0-.6.4-1 1-1Z" />
    <path d="M12 6.2v12.2" />
    <path d="M7.8 9.8h3.6M7.8 12.4h2.4M13.2 9.8h3.6M13.2 12.4h2.4" />
    <circle cx="12" cy="17" r="2.4" fill="none" />
    <circle cx="12" cy="17" r="1" fill="currentColor" />
  `,
  herb: /*html*/`
    <path d="M6.6 18.6h10.8" />
    <path d="M9.4 18.6v-3.8c-1.2-1.4-3.4-1.2-3.8 0" />
    <path d="M12 18.6v-6c-1.6-2-4.6-1.6-5.4 0" />
    <path d="M14.6 18.6v-3.8c1.2-1.4 3.4-1.2 3.8 0" />
    <path d="M12 18.6v-6c1.6-2 4.6-1.6 5.4 0" />
    <path d="M12 7.2v2.4c-1.4 1-4 0.6-4.4-1.6C8.4 5.4 12 4.6 12 7.2Z" />
    <circle cx="9.6" cy="9.6" r="0.6" fill="currentColor" />
    <circle cx="12" cy="5.4" r="0.6" fill="currentColor" />
  `,
  channels: /*html*/`
    <path d="M12 3.4c-2.2 1.2-3.4 3.4-3.4 6 0 2 1 3.2 2 4.6 1 1.4 1.4 2.6 1.4 4.6" />
    <path d="M12 3.4c2.2 1.2 3.4 3.4 3.4 6 0 2-1 3.2-2 4.6-1 1.4-1.4 2.6-1.4 4.6" />
    <circle cx="12" cy="3.4" r="1" fill="currentColor" />
    <circle cx="8.6" cy="9.4" r="0.8" fill="currentColor" />
    <circle cx="15.4" cy="9.4" r="0.8" fill="currentColor" />
    <circle cx="10.6" cy="14" r="0.8" fill="currentColor" />
    <circle cx="13.4" cy="14" r="0.8" fill="currentColor" />
    <circle cx="12" cy="19" r="0.8" fill="currentColor" />
  `,
  nineteen: /*html*/`
    <path d="M5 10.6h4.8L12 14l2.2-3.4H19" />
    <path d="M5 15h14" />
    <path d="M6.6 6.2 8.6 8 6.6 9.8" transform="translate(4 -0.6) rotate(-15 12 12)" />
    <path d="M17.6 6.2 15.6 8 17.6 9.8" transform="translate(-4 -0.6) rotate(15 12 12)" />
    <circle cx="7.4" cy="7" r="0.9" fill="currentColor" />
    <circle cx="16.6" cy="7" r="0.9" fill="currentColor" />
  `,
  jiebiao: /*html*/`
    <path d="M10 19c-2.2-1.2-4-3.2-4.2-5.4 0-2.8 2.4-5 4.2-5.8 1.6 1 4.2 3 4.2 5.8C14 15.8 12.2 17.8 10 19Z" />
    <path d="M14 8V4M16 6.6h-4" />
    <path d="M17.2 12.6c1.2-1 2.4-2.6 3-4.4" />
    <path d="M15 14.4c1.8-0.6 3.4-2.2 4-4.2" />
    <circle cx="11" cy="12" r="0.8" fill="currentColor" />
    <circle cx="9.2" cy="14.8" r="0.6" fill="currentColor" />
  `,
  bagang: /*html*/`
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 3.8A8.2 8.2 0 0 0 12 20.2" />
    <circle cx="12" cy="12" r="4.4" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    <circle cx="12" cy="4.6" r="0.8" fill="currentColor" />
    <circle cx="12" cy="19.4" r="0.8" fill="currentColor" />
    <circle cx="4.6" cy="12" r="0.8" fill="currentColor" />
    <circle cx="19.4" cy="12" r="0.8" fill="currentColor" />
    <circle cx="6.7" cy="6.7" r="0.7" fill="currentColor" />
    <circle cx="17.3" cy="6.7" r="0.7" fill="currentColor" />
    <circle cx="6.7" cy="17.3" r="0.7" fill="currentColor" />
    <circle cx="17.3" cy="17.3" r="0.7" fill="currentColor" />
  `,
  fallbackBookSprout: /*html*/`
    <path d="M5 17h14" />
    <rect x="5" y="6" width="12.4" height="9" rx="1.4" />
    <path d="M8.2 9h6.4M8.2 11.4h4.2" />
    <path d="M10.6 5.6C9.8 4.8 10 3.2 12 2.8C13.2 4.6 13.2 5.2 11.8 6.2" />
  `,
};

/* 主题色（低饱和，不做彩虹；同色系明暗） */
export const COURSE_THEMES = {
  acupoint: { bgLight: "#eaf4ef", bgDeep: "#bfd6c6", fg: "#2f6f54" },
  shanghan: { bgLight: "#eff3ee", bgDeep: "#c9d2cd", fg: "#495a52" },
  formula:  { bgLight: "#f3efe7", bgDeep: "#d7cdb9", fg: "#6b5c41" },
  diagnose: { bgLight: "#eef3f1", bgDeep: "#c4d0ca", fg: "#4f635c" },
  wenbing:  { bgLight: "#eef2ef", bgDeep: "#c2cfc6", fg: "#52645a" },
  tcmBasic: { bgLight: "#eef4ee", bgDeep: "#c4d6c6", fg: "#37684a" },
  neijing:  { bgLight: "#eef1ed", bgDeep: "#c5cdc4", fg: "#535d50" },
  herb:     { bgLight: "#e8f3e8", bgDeep: "#b7d4b7", fg: "#38683c" },
  channels: { bgLight: "#e9f0f1", bgDeep: "#bccdc8", fg: "#4f6e6a" },
  nineteen: { bgLight: "#f2eee4", bgDeep: "#d6c6a9", fg: "#7a6238" },
  jiebiao:  { bgLight: "#e7f1eb", bgDeep: "#b4cfbf", fg: "#3e755a" },
  bagang:   { bgLight: "#eaf0ea", bgDeep: "#bfd1c1", fg: "#456c56" },
  fallback: { bgLight: "#eef3ee", bgDeep: "#c2cfc4", fg: "#4c6a58" },
};

/* 标准课程 ID / 名称 → 标准 key（唯一真源；别名也走这里） */
export const COURSE_KEY_BY_NAME = {
  "针灸学": "acupoint",
  "针灸":   "acupoint",
  "伤寒论": "shanghan",
  "伤寒":   "shanghan",
  "方剂学": "formula",
  "方剂":   "formula",
  "中医诊断学": "diagnose",
  "中医诊断":   "diagnose",
  "诊断":       "diagnose",
  "温病学": "wenbing",
  "温病":   "wenbing",
  "中医基础理论": "tcmBasic",
  "中医基础":     "tcmBasic",
  "基础理论":     "tcmBasic",
  "黄帝内经": "neijing",
  "内经":     "neijing",
  "中药学": "herb",
  "中药":   "herb",
  "奇经八脉": "channels",
  "经络":     "channels",
  "十九畏": "nineteen",
  "十八反": "nineteen",
  "解表剂": "jiebiao",
  "八纲辨证": "bagang",
  "八纲":     "bagang",
  "辨证":     "bagang",
  // 通用简称
  "中医":   "fallback", // 别名兜底：医书嫩芽
  "综合":   "fallback",
  "其他":   "fallback",
};

/* 把旧 API 里的 COURSES[].courseId 也映射到同一标准 key（避免 report.js 的老 key 跟新体系脱节） */
export const COURSE_KEY_BY_ID = {
  "acupoint": "acupoint",
  "shanghan": "shanghan",
  "formula":  "formula",
  "diagnose": "diagnose",
  "wenbing":  "wenbing",
  "tcm-basic":"tcmBasic",
  "neijing":  "neijing",
  "herb":     "herb",
  "channels": "channels",
  "nineteen": "nineteen",
  "jiebiao":  "jiebiao",
  "bagang":   "bagang",
};

/** 根据 name 或 courseId 查标准 course key；找不到 fallback */
export function resolveCourseKey({ name, courseId } = {}) {
  if (courseId && COURSE_KEY_BY_ID[courseId]) return COURSE_KEY_BY_ID[courseId];
  if (name) {
    // 先精确
    if (COURSE_KEY_BY_NAME[name]) return COURSE_KEY_BY_NAME[name];
    // 再包含匹配（"中医基础" / "中医诊断" / "仲景伤寒" 这类简称）
    const keys = Object.keys(COURSE_KEY_BY_NAME).filter((k) => k.length >= 2);
    for (const k of keys) {
      if (name.includes(k)) return COURSE_KEY_BY_NAME[k];
    }
  }
  // 最后的兜底：用 name 直接做 key（避免重复逻辑）；找不到再 fallback
  if (courseId && COURSE_THEMES[courseId]) return courseId;
  return "fallback";
}

export function getCourseTheme(courseKey) {
  return COURSE_THEMES[courseKey] || COURSE_THEMES.fallback;
}

export function getCourseShape(courseKey) {
  return COURSE_SHAPE_SVGS[courseKey] || COURSE_SHAPE_SVGS.fallbackBookSprout;
}

/* 内容墙生成 12 格时：空的"中医"不要用 6 个 emoji 循环，统一走备用医书嫩芽或知识点节点图案 */
export const EXTRA_CELL_ICON_KEY = "fallbackBookSprout";
export const KP_CELL_ICON_KEY = "statKp"; // 知识点使用 statKp（节点+连线），不要 ✦ 字
