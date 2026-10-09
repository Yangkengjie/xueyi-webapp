/* ============================================================
 * 学医智用 · 成就系统定义
 * 结构：成就定义(静态) 与 用户进度(动态) 完全分离
 * 修改定义不会影响已解锁状态
 * ============================================================ */

/* ---------- 一、每日学习状态（非永久成就，仅用于首页当天展示） ----------
   边界严格：
   < 15min              → 浮生偷闲
   ≥15min  &&  <45min   → 渐入佳境
   ≥45min  &&  <90min   → 腹有初藏
   ≥90min  &&  <150min  → 青灯伴卷
   ≥150min              → 高歌夜半雪压庐
*/
export const DAILY_STATUS = [
  { key: "fu_sheng",  name: "浮生偷闲",      min: 0,   max: 15,          desc: "偷得浮生一刻闲",      iconKey: "journey" },
  { key: "jian_ru",   name: "渐入佳境",      min: 15,  max: 45,          desc: "我要学习喵！",         iconKey: "adviceStar" },
  { key: "fu_chu",    name: "腹有初藏",      min: 45,  max: 90,          desc: "我爱学习喵！",         iconKey: "statCourse" },
  { key: "qing_deng", name: "青灯伴卷",      min: 90,  max: 150,         desc: "书山学海，黄卷青灯",   iconKey: "review" },
  { key: "gao_ge",    name: "高歌夜半雪压庐", min: 150, max: Infinity,    desc: "读书之乐何处寻，数点梅花天地心", iconKey: "recentFlame" },
];

export function getDailyStatusByMinutes(minutes) {
  const m = Number(minutes) || 0;
  for (let i = DAILY_STATUS.length - 1; i >= 0; i--) {
    const s = DAILY_STATUS[i];
    if (m >= s.min && m < s.max) return { ...s };
  }
  return { ...DAILY_STATUS[0] };
}

/* ---------- 二、成就分类 ---------- */
export const ACHIEVEMENT_CATEGORIES = [
  { key: "all",        name: "全部",     iconKey: "task" },
  { key: "streak",     name: "学习天数", iconKey: "refresh" },
  { key: "subject",    name: "科目",     iconKey: "statCourse" },
  { key: "plan",       name: "计划",     iconKey: "adviceStar" },
  { key: "knowledge",  name: "知识互动", iconKey: "statKp" },
  { key: "specialty",  name: "专项学习", iconKey: "review" },
  { key: "ai",         name: "AI互动",   iconKey: "tutorBubble" },
];

/* ---------- 三、成就定义（静态）-------------
  字段说明：
  - id           唯一键
  - category     分类（streak / subject / plan / knowledge / specialty / ai）
  - name         名称
  - level        分级数字（Ⅰ=1, Ⅱ=2...）
  - description  达成条件文案
  - metric       主指标：当只含单一阈值时用
  - threshold    主阈值：当只含单一阈值时用
  - conditions   复合条件：当成就需要多指标同时满足时用
    [{ metric, threshold }]
  - hidden       true=不在前端展示（待确认成就）
  - noteProduct  TODO 注释：等待产品确认阈值/命名
------------------------------------------------ */

export const ACHIEVEMENT_DEFINITIONS = [

  /* ---------- Streak · 学习天数 8 个 ---------- */
  { id: "streak_001", category: "streak", name: "一日萌芽", level: 1,
    description: "累计有效学习1天", metric: "activeStudyDays", threshold: 1 },
  { id: "streak_003", category: "streak", name: "三日凝思", level: 1,
    description: "累计有效学习3天", metric: "activeStudyDays", threshold: 3 },
  { id: "streak_007", category: "streak", name: "七日筑基", level: 1,
    description: "累计有效学习7天", metric: "activeStudyDays", threshold: 7 },
  { id: "streak_030", category: "streak", name: "学习达人Ⅰ", level: 1,
    description: "累计有效学习30天", metric: "activeStudyDays", threshold: 30 },
  { id: "streak_050", category: "streak", name: "学习达人Ⅱ", level: 2,
    description: "累计有效学习50天", metric: "activeStudyDays", threshold: 50 },
  { id: "streak_100", category: "streak", name: "学习达人Ⅲ", level: 3,
    description: "累计有效学习100天", metric: "activeStudyDays", threshold: 100 },
  { id: "streak_180", category: "streak", name: "半载躬行", level: 1,
    description: "累计有效学习180天", metric: "activeStudyDays", threshold: 180 },
  { id: "streak_365", category: "streak", name: "岁久功成", level: 1,
    description: "累计有效学习365天", metric: "activeStudyDays", threshold: 365 },

  /* ---------- Subject · 科目学习 7 个 ---------- */
  { id: "sub_first", category: "subject", name: "初出茅庐", level: 1,
    description: "开始学习任意1个科目", metric: "startedSubjects", threshold: 1,
    hasExtraInfo: true /* + 首科日期+名称 */ },
  { id: "sub_5", category: "subject", name: "营养均衡Ⅰ", level: 1,
    description: "开始学习5个不同科目", metric: "startedSubjects", threshold: 5 },
  { id: "sub_10", category: "subject", name: "营养均衡Ⅱ", level: 2,
    description: "开始学习10个不同科目", metric: "startedSubjects", threshold: 10 },
  { id: "sub_20", category: "subject", name: "营养均衡Ⅲ", level: 3,
    description: "开始学习20个不同科目", metric: "startedSubjects", threshold: 20 },
  { id: "sub_hexa_2", category: "subject", name: "六边形战士Ⅰ", level: 1,
    description: "完成中医类科目至少2门，西医类科目至少2门",
    conditions: [
      { metric: "completedTcmSubjects", threshold: 2 },
      { metric: "completedWesternSubjects", threshold: 2 },
    ]},
  { id: "sub_hexa_4", category: "subject", name: "六边形战士Ⅱ", level: 2,
    description: "完成中医类科目至少4门，西医类科目至少4门",
    conditions: [
      { metric: "completedTcmSubjects", threshold: 4 },
      { metric: "completedWesternSubjects", threshold: 4 },
    ]},
  { id: "sub_hexa_6", category: "subject", name: "六边形战士Ⅲ", level: 3,
    description: "完成中医类科目至少6门，西医类科目至少6门",
    conditions: [
      { metric: "completedTcmSubjects", threshold: 6 },
      { metric: "completedWesternSubjects", threshold: 6 },
    ]},

  /* ---------- Plan · 计划成就 12 个 ---------- */
  { id: "plan_day", category: "plan", name: "今日KPI达成", level: 1,
    description: "完成当天全部学习任务", metric: "perfectDays", threshold: 1,
    eventDriven: true },
  { id: "plan_week", category: "plan", name: "完美的周计划", level: 1,
    description: "一个自然周内，每一天的计划任务均全部完成", metric: "perfectWeeks", threshold: 1,
    eventDriven: true },
  { id: "plan_month", category: "plan", name: "完美的月计划", level: 1,
    description: "一个自然月内，每一天的计划任务均全部完成", metric: "perfectMonths", threshold: 1,
    eventDriven: true },
  { id: "plan_005", category: "plan", name: "自律达人Ⅰ", level: 1,
    description: "累计达成5个日计划", metric: "perfectDays", threshold: 5 },
  { id: "plan_010", category: "plan", name: "自律达人Ⅱ", level: 2,
    description: "累计达成10个日计划", metric: "perfectDays", threshold: 10 },
  { id: "plan_100", category: "plan", name: "自律达人Ⅲ", level: 3,
    description: "累计达成100个日计划", metric: "perfectDays", threshold: 100 },
  { id: "plan_500", category: "plan", name: "自律达人Ⅳ", level: 4,
    description: "累计达成500个日计划", metric: "perfectDays", threshold: 500 },
  { id: "plan_1000", category: "plan", name: "自律达人Ⅴ", level: 5,
    description: "累计达成1000个日计划", metric: "perfectDays", threshold: 1000 },

  /* TODO：Ⅱ~Ⅴ 等待产品确认阈值（不要在 UI 展示） */
  { id: "plan_wk_master_1", category: "plan", name: "计划大师Ⅰ", level: 1,
    description: "累计达成2次“完美的周计划”", metric: "perfectWeeks", threshold: 2 },
  { id: "plan_wk_master_2", category: "plan", name: "计划大师Ⅱ", level: 2, hidden: true,
    noteProduct: "等待产品确认“计划大师Ⅱ~Ⅴ”的阈值，暂不展示",
    description: "累计达成N次完美周计划（TODO 待产品确认）",
    metric: "perfectWeeks", threshold: 2 },
  { id: "plan_wk_master_3", category: "plan", name: "计划大师Ⅲ", level: 3, hidden: true,
    noteProduct: "等待产品确认“计划大师Ⅱ~Ⅴ”的阈值，暂不展示",
    description: "累计达成N次完美周计划（TODO 待产品确认）",
    metric: "perfectWeeks", threshold: 2 },
  { id: "plan_wk_master_4", category: "plan", name: "计划大师Ⅳ", level: 4, hidden: true,
    noteProduct: "等待产品确认“计划大师Ⅱ~Ⅴ”的阈值，暂不展示",
    description: "累计达成N次完美周计划（TODO 待产品确认）",
    metric: "perfectWeeks", threshold: 2 },
  { id: "plan_wk_master_5", category: "plan", name: "计划大师Ⅴ", level: 5, hidden: true,
    noteProduct: "等待产品确认“计划大师Ⅱ~Ⅴ”的阈值，暂不展示",
    description: "累计达成N次完美周计划（TODO 待产品确认）",
    metric: "perfectWeeks", threshold: 2 },

  { id: "plan_mo_master_1", category: "plan", name: "月度计划大师Ⅰ", level: 1,
    description: "累计达成2次“完美的月计划”", metric: "perfectMonths", threshold: 2 },
  { id: "plan_mo_master_2", category: "plan", name: "月度计划大师Ⅱ", level: 2, hidden: true,
    noteProduct: "等待产品确认“月度计划大师Ⅱ~Ⅴ”的阈值，暂不展示",
    description: "累计达成N次完美月计划（TODO 待产品确认）",
    metric: "perfectMonths", threshold: 2 },
  { id: "plan_mo_master_3", category: "plan", name: "月度计划大师Ⅲ", level: 3, hidden: true,
    noteProduct: "等待产品确认“月度计划大师Ⅱ~Ⅴ”的阈值，暂不展示",
    description: "累计达成N次完美月计划（TODO 待产品确认）",
    metric: "perfectMonths", threshold: 2 },
  { id: "plan_mo_master_4", category: "plan", name: "月度计划大师Ⅳ", level: 4, hidden: true,
    noteProduct: "等待产品确认“月度计划大师Ⅱ~Ⅴ”的阈值，暂不展示",
    description: "累计达成N次完美月计划（TODO 待产品确认）",
    metric: "perfectMonths", threshold: 2 },
  { id: "plan_mo_master_5", category: "plan", name: "月度计划大师Ⅴ", level: 5, hidden: true,
    noteProduct: "等待产品确认“月度计划大师Ⅱ~Ⅴ”的阈值，暂不展示",
    description: "累计达成N次完美月计划（TODO 待产品确认）",
    metric: "perfectMonths", threshold: 2 },

  /* ---------- Knowledge · 知识互动 11 个 ---------- */
  { id: "kb_cmt_001", category: "knowledge", name: "神秘高冷", level: 1,
    description: "累计发布1条评论", metric: "commentsTotal", threshold: 1 },
  { id: "kb_cmt_050", category: "knowledge", name: "掀起水花", level: 1,
    description: "累计发布50条评论", metric: "commentsTotal", threshold: 50 },
  { id: "kb_cmt_200", category: "knowledge", name: "略有耳闻", level: 2,
    description: "累计发布200条评论", metric: "commentsTotal", threshold: 200 },
  { id: "kb_cmt_300", category: "knowledge", name: "小有名气", level: 3,
    description: "累计发布300条评论", metric: "commentsTotal", threshold: 300 },
  { id: "kb_cmt_500", category: "knowledge", name: "大有名气", level: 4,
    description: "累计发布500条评论", metric: "commentsTotal", threshold: 500 },

  { id: "kb_like_020", category: "knowledge", name: "前辈的密言Ⅰ", level: 1,
    description: "至少20条评论的点赞数达到10", metric: "commentsLiked10", threshold: 20 },
  { id: "kb_like_050", category: "knowledge", name: "前辈的密言Ⅱ", level: 2,
    description: "至少50条评论的点赞数达到10", metric: "commentsLiked10", threshold: 50 },
  { id: "kb_like_100", category: "knowledge", name: "前辈的密言Ⅲ", level: 3,
    description: "至少100条评论的点赞数达到10", metric: "commentsLiked10", threshold: 100 },

  { id: "kb_link_010", category: "knowledge", name: "阿巴阿巴", level: 1,
    description: "累计创建10条知识关联", metric: "knowledgeLinks", threshold: 10 },
  { id: "kb_link_100", category: "knowledge", name: "灵智初开", level: 2,
    description: "累计创建100条知识关联", metric: "knowledgeLinks", threshold: 100 },
  { id: "kb_link_500", category: "knowledge", name: "大脑迷宫", level: 3,
    description: "累计创建500条知识关联", metric: "knowledgeLinks", threshold: 500 },

  /* TODO：以下成就等待产品确认知识点数量阈值（暂不展示） */
  { id: "kb_kp_clear", category: "knowledge", name: "清澈的眼神", level: 1, hidden: true,
    noteProduct: "等待产品确认知识点数量阈值",
    description: "掌握N个知识点（TODO 待产品确认）", metric: "masteredKps", threshold: 1 },
  { id: "kb_huaqian_1", category: "knowledge", name: "花前坐Ⅰ", level: 1, hidden: true,
    noteProduct: "等待产品确认阈值",
    description: "TODO 待产品确认", metric: "masteredKps", threshold: 1 },
  { id: "kb_huaqian_2", category: "knowledge", name: "花前坐Ⅱ", level: 2, hidden: true,
    noteProduct: "等待产品确认阈值",
    description: "TODO 待产品确认", metric: "masteredKps", threshold: 1 },
  { id: "kb_huaqian_3", category: "knowledge", name: "花前坐Ⅲ", level: 3, hidden: true,
    noteProduct: "等待产品确认阈值",
    description: "TODO 待产品确认", metric: "masteredKps", threshold: 1 },
  { id: "kb_xuefu_1", category: "knowledge", name: "学富五车Ⅰ", level: 1, hidden: true,
    noteProduct: "等待产品确认阈值",
    description: "TODO 待产品确认", metric: "masteredKps", threshold: 1 },
  { id: "kb_xuefu_2", category: "knowledge", name: "学富五车Ⅱ", level: 2, hidden: true,
    noteProduct: "等待产品确认阈值",
    description: "TODO 待产品确认", metric: "masteredKps", threshold: 1 },
  { id: "kb_xuefu_3", category: "knowledge", name: "学富五车Ⅲ", level: 3, hidden: true,
    noteProduct: "等待产品确认阈值",
    description: "TODO 待产品确认", metric: "masteredKps", threshold: 1 },

  /* ---------- Specialty · 专项学习时长（4系列×4级 = 16个） ----------
     根据 categoryKey 聚合：
     materia_medica = 中药学
     shang_han      = 伤寒论
     nei_jing       = 内经
     jin_gui        = 金匮要略
     单位：小时（×60 分钟）
  */
  { id: "spe_mat_1", category: "specialty", name: "神农Ⅰ", level: 1,
    description: "中药学累计学习时长达到1小时", metric: "materia_medicaHours", threshold: 1 },
  { id: "spe_mat_2", category: "specialty", name: "神农Ⅱ", level: 2,
    description: "中药学累计学习时长达到2小时", metric: "materia_medicaHours", threshold: 2 },
  { id: "spe_mat_3", category: "specialty", name: "神农Ⅲ", level: 3,
    description: "中药学累计学习时长达到3小时", metric: "materia_medicaHours", threshold: 3 },
  { id: "spe_mat_4", category: "specialty", name: "神农Ⅳ", level: 4,
    description: "中药学累计学习时长达到4小时", metric: "materia_medicaHours", threshold: 4 },

  { id: "spe_shh_1", category: "specialty", name: "伤寒Ⅰ", level: 1,
    description: "伤寒论相关内容累计学习时长达到1小时", metric: "shang_hanHours", threshold: 1 },
  { id: "spe_shh_2", category: "specialty", name: "伤寒Ⅱ", level: 2,
    description: "伤寒论相关内容累计学习时长达到2小时", metric: "shang_hanHours", threshold: 2 },
  { id: "spe_shh_3", category: "specialty", name: "伤寒Ⅲ", level: 3,
    description: "伤寒论相关内容累计学习时长达到3小时", metric: "shang_hanHours", threshold: 3 },
  { id: "spe_shh_4", category: "specialty", name: "伤寒Ⅳ", level: 4,
    description: "伤寒论相关内容累计学习时长达到4小时", metric: "shang_hanHours", threshold: 4 },

  { id: "spe_nei_1", category: "specialty", name: "内经Ⅰ", level: 1,
    description: "内经相关内容累计学习时长达到1小时", metric: "nei_jingHours", threshold: 1 },
  { id: "spe_nei_2", category: "specialty", name: "内经Ⅱ", level: 2,
    description: "内经相关内容累计学习时长达到2小时", metric: "nei_jingHours", threshold: 2 },
  { id: "spe_nei_3", category: "specialty", name: "内经Ⅲ", level: 3,
    description: "内经相关内容累计学习时长达到3小时", metric: "nei_jingHours", threshold: 3 },
  { id: "spe_nei_4", category: "specialty", name: "内经Ⅳ", level: 4,
    description: "内经相关内容累计学习时长达到4小时", metric: "nei_jingHours", threshold: 4 },

  { id: "spe_jin_1", category: "specialty", name: "金匮Ⅰ", level: 1,
    description: "金匮要略相关内容累计学习时长达到1小时", metric: "jin_guiHours", threshold: 1 },
  { id: "spe_jin_2", category: "specialty", name: "金匮Ⅱ", level: 2,
    description: "金匮要略相关内容累计学习时长达到2小时", metric: "jin_guiHours", threshold: 2 },
  { id: "spe_jin_3", category: "specialty", name: "金匮Ⅲ", level: 3,
    description: "金匮要略相关内容累计学习时长达到3小时", metric: "jin_guiHours", threshold: 3 },
  { id: "spe_jin_4", category: "specialty", name: "金匮Ⅳ", level: 4,
    description: "金匮要略相关内容累计学习时长达到4小时", metric: "jin_guiHours", threshold: 4 },

  /* TODO: 等待产品确认中妇、中儿系列成就的阈值与分级；当前隐藏，不参与进度计算 */
  { id: "spe_zhong_fu_1", category: "specialty", name: "中妇Ⅰ", level: 1, hidden: true,
    noteProduct: "TODO: 等待产品确认中妇系列成就（中妇Ⅰ~Ⅳ）的阈值、指标、分级命名，暂不展示",
    description: "中医妇科学累计学习时长达到 N 小时（TODO：N 待产品确认）",
    metric: "zhong_fuHours", threshold: 1 },
  { id: "spe_zhong_fu_2", category: "specialty", name: "中妇Ⅱ", level: 2, hidden: true,
    noteProduct: "TODO: 等待产品确认中妇系列成就（中妇Ⅰ~Ⅳ）的阈值、指标、分级命名，暂不展示",
    description: "中医妇科学累计学习时长达到 N 小时（TODO：N 待产品确认）",
    metric: "zhong_fuHours", threshold: 1 },
  { id: "spe_zhong_fu_3", category: "specialty", name: "中妇Ⅲ", level: 3, hidden: true,
    noteProduct: "TODO: 等待产品确认中妇系列成就（中妇Ⅰ~Ⅳ）的阈值、指标、分级命名，暂不展示",
    description: "中医妇科学累计学习时长达到 N 小时（TODO：N 待产品确认）",
    metric: "zhong_fuHours", threshold: 1 },
  { id: "spe_zhong_fu_4", category: "specialty", name: "中妇Ⅳ", level: 4, hidden: true,
    noteProduct: "TODO: 等待产品确认中妇系列成就（中妇Ⅰ~Ⅳ）的阈值、指标、分级命名，暂不展示",
    description: "中医妇科学累计学习时长达到 N 小时（TODO：N 待产品确认）",
    metric: "zhong_fuHours", threshold: 1 },

  { id: "spe_zhong_er_1", category: "specialty", name: "中儿Ⅰ", level: 1, hidden: true,
    noteProduct: "TODO: 等待产品确认中儿系列成就（中儿Ⅰ~Ⅳ）的阈值、指标、分级命名，暂不展示",
    description: "中医儿科学累计学习时长达到 N 小时（TODO：N 待产品确认）",
    metric: "zhong_erHours", threshold: 1 },
  { id: "spe_zhong_er_2", category: "specialty", name: "中儿Ⅱ", level: 2, hidden: true,
    noteProduct: "TODO: 等待产品确认中儿系列成就（中儿Ⅰ~Ⅳ）的阈值、指标、分级命名，暂不展示",
    description: "中医儿科学累计学习时长达到 N 小时（TODO：N 待产品确认）",
    metric: "zhong_erHours", threshold: 1 },
  { id: "spe_zhong_er_3", category: "specialty", name: "中儿Ⅲ", level: 3, hidden: true,
    noteProduct: "TODO: 等待产品确认中儿系列成就（中儿Ⅰ~Ⅳ）的阈值、指标、分级命名，暂不展示",
    description: "中医儿科学累计学习时长达到 N 小时（TODO：N 待产品确认）",
    metric: "zhong_erHours", threshold: 1 },
  { id: "spe_zhong_er_4", category: "specialty", name: "中儿Ⅳ", level: 4, hidden: true,
    noteProduct: "TODO: 等待产品确认中儿系列成就（中儿Ⅰ~Ⅳ）的阈值、指标、分级命名，暂不展示",
    description: "中医儿科学累计学习时长达到 N 小时（TODO：N 待产品确认）",
    metric: "zhong_erHours", threshold: 1 },

  /* ---------- AI · 问答数量 5 个 ---------- */
  { id: "ai_q_010",   category: "ai", name: "十个为什么",      level: 1, description: "累计向AI提问10个问题",      metric: "aiAnsweredQuestions", threshold: 10 },
  { id: "ai_q_100",   category: "ai", name: "一百个为什么",    level: 2, description: "累计向AI提问100个问题",     metric: "aiAnsweredQuestions", threshold: 100 },
  { id: "ai_q_500",   category: "ai", name: "一万个为什么Ⅰ",   level: 3, description: "累计向AI提问500个问题",     metric: "aiAnsweredQuestions", threshold: 500 },
  { id: "ai_q_1000",  category: "ai", name: "一万个为什么Ⅱ",   level: 4, description: "累计向AI提问1000个问题",    metric: "aiAnsweredQuestions", threshold: 1000 },
  { id: "ai_q_1500",  category: "ai", name: "一万个为什么Ⅲ",   level: 5, description: "累计向AI提问1500个问题",    metric: "aiAnsweredQuestions", threshold: 1500 },

  /* ---------- AI · 评价成就 9 个（膜拜 3 + 求真者 3 + 日月同辉 3） ---------- */
  { id: "ai_fb_ok_010",  category: "ai", name: "膜拜大佬Ⅰ", level: 1,
    description: "累计确认AI回答准确10次", metric: "aiAccurateFeedbacks", threshold: 10 },
  { id: "ai_fb_ok_050",  category: "ai", name: "膜拜大佬Ⅱ", level: 2,
    description: "累计确认AI回答准确50次", metric: "aiAccurateFeedbacks", threshold: 50 },
  { id: "ai_fb_ok_100",  category: "ai", name: "膜拜大佬Ⅲ", level: 3,
    description: "累计确认AI回答准确100次", metric: "aiAccurateFeedbacks", threshold: 100 },

  /* 求真者系列：内部名称，UI暂不暴露（原"大笨蛋/身残志坚"名称存在冒犯性）
     noteProduct: 等待产品确认最终名称，前端展示时用"求真者"+说明 */
  { id: "ai_fb_bad_010",  category: "ai", name: "求真者Ⅰ", level: 1,
    noteProduct: "名称待产品最终确认（原设计名存在冒犯性，暂用\"求真者\"代替）",
    description: "累计指出AI回答偏差10次", metric: "aiInaccurateFeedbacks", threshold: 10 },
  { id: "ai_fb_bad_050",  category: "ai", name: "求真者Ⅱ", level: 2,
    noteProduct: "名称待产品最终确认（原设计名存在冒犯性，暂用\"求真者\"代替）",
    description: "累计指出AI回答偏差50次", metric: "aiInaccurateFeedbacks", threshold: 50 },
  { id: "ai_fb_bad_100",  category: "ai", name: "求真者Ⅲ", level: 3,
    noteProduct: "名称待产品最终确认（原设计名存在冒犯性，暂用\"求真者\"代替）",
    description: "累计指出AI回答偏差100次", metric: "aiInaccurateFeedbacks", threshold: 100 },

  /* 组合成就：同时满足求真 I/II/III + 膜拜 I/II/III */
  { id: "ai_combo_1", category: "ai", name: "日月同辉Ⅰ", level: 1,
    description: "同时达成求真者Ⅰ和膜拜大佬Ⅰ",
    conditions: [
      { metric: "aiAccurateFeedbacks", threshold: 10 },
      { metric: "aiInaccurateFeedbacks", threshold: 10 },
    ]},
  { id: "ai_combo_2", category: "ai", name: "日月同辉Ⅱ", level: 2,
    description: "同时达成求真者Ⅱ和膜拜大佬Ⅱ",
    conditions: [
      { metric: "aiAccurateFeedbacks", threshold: 50 },
      { metric: "aiInaccurateFeedbacks", threshold: 50 },
    ]},
  { id: "ai_combo_3", category: "ai", name: "日月同辉Ⅲ", level: 3,
    description: "同时达成求真者Ⅲ和膜拜大佬Ⅲ",
    conditions: [
      { metric: "aiAccurateFeedbacks", threshold: 100 },
      { metric: "aiInaccurateFeedbacks", threshold: 100 },
    ]},

  /* ---------- AI · 互动行为 4×3 = 12 个（每系列Ⅰ~Ⅳ，门槛10/20/30/40次） ---------- */
  { id: "ai_act_sibian_10",  category: "ai", name: "思辨Ⅰ", level: 1, description: "有效反驳或纠正AI达到10次", metric: "aiCorrections", threshold: 10 },
  { id: "ai_act_sibian_20",  category: "ai", name: "思辨Ⅱ", level: 2, description: "有效反驳或纠正AI达到20次", metric: "aiCorrections", threshold: 20 },
  { id: "ai_act_sibian_30",  category: "ai", name: "思辨Ⅲ", level: 3, description: "有效反驳或纠正AI达到30次", metric: "aiCorrections", threshold: 30 },
  { id: "ai_act_sibian_40",  category: "ai", name: "思辨Ⅳ", level: 4, description: "有效反驳或纠正AI达到40次", metric: "aiCorrections", threshold: 40 },

  { id: "ai_act_wenhu_10",  category: "ai", name: "列文虎克Ⅰ", level: 1, description: "针对回答细节追问达到10次", metric: "aiDetailFollowups", threshold: 10 },
  { id: "ai_act_wenhu_20",  category: "ai", name: "列文虎克Ⅱ", level: 2, description: "针对回答细节追问达到20次", metric: "aiDetailFollowups", threshold: 20 },
  { id: "ai_act_wenhu_30",  category: "ai", name: "列文虎克Ⅲ", level: 3, description: "针对回答细节追问达到30次", metric: "aiDetailFollowups", threshold: 30 },
  { id: "ai_act_wenhu_40",  category: "ai", name: "列文虎克Ⅳ", level: 4, description: "针对回答细节追问达到40次", metric: "aiDetailFollowups", threshold: 40 },

  { id: "ai_act_bz_10",  category: "ai", name: "辨证Ⅰ", level: 1, description: "提出辨证相关问题达到10次", metric: "aiSyndromeQuestions", threshold: 10 },
  { id: "ai_act_bz_20",  category: "ai", name: "辨证Ⅱ", level: 2, description: "提出辨证相关问题达到20次", metric: "aiSyndromeQuestions", threshold: 20 },
  { id: "ai_act_bz_30",  category: "ai", name: "辨证Ⅲ", level: 3, description: "提出辨证相关问题达到30次", metric: "aiSyndromeQuestions", threshold: 30 },
  { id: "ai_act_bz_40",  category: "ai", name: "辨证Ⅳ", level: 4, description: "提出辨证相关问题达到40次", metric: "aiSyndromeQuestions", threshold: 40 },

  /* TODO: 等待产品确认"按辨证分类"与"按提示词分类"的 AI 系列成就的阈值与分级命名；当前隐藏 */
  { id: "ai_bz_cat_1", category: "ai", name: "按辨证分类Ⅰ", level: 1, hidden: true,
    noteProduct: "TODO: 等待产品确认\"按辨证分类\"系列（Ⅰ~Ⅳ）的阈值、按什么维度分类、分级命名，暂不展示",
    description: "按辨证提问分类达到 N 次（TODO：N 待产品确认）",
    metric: "aiSyndromeQuestions", threshold: 1 },
  { id: "ai_bz_cat_2", category: "ai", name: "按辨证分类Ⅱ", level: 2, hidden: true,
    noteProduct: "TODO: 等待产品确认\"按辨证分类\"系列（Ⅰ~Ⅳ）的阈值、按什么维度分类、分级命名，暂不展示",
    description: "按辨证提问分类达到 N 次（TODO：N 待产品确认）",
    metric: "aiSyndromeQuestions", threshold: 1 },
  { id: "ai_bz_cat_3", category: "ai", name: "按辨证分类Ⅲ", level: 3, hidden: true,
    noteProduct: "TODO: 等待产品确认\"按辨证分类\"系列（Ⅰ~Ⅳ）的阈值、按什么维度分类、分级命名，暂不展示",
    description: "按辨证提问分类达到 N 次（TODO：N 待产品确认）",
    metric: "aiSyndromeQuestions", threshold: 1 },
  { id: "ai_bz_cat_4", category: "ai", name: "按辨证分类Ⅳ", level: 4, hidden: true,
    noteProduct: "TODO: 等待产品确认\"按辨证分类\"系列（Ⅰ~Ⅳ）的阈值、按什么维度分类、分级命名，暂不展示",
    description: "按辨证提问分类达到 N 次（TODO：N 待产品确认）",
    metric: "aiSyndromeQuestions", threshold: 1 },

  { id: "ai_prompt_cat_1", category: "ai", name: "按提示词分类Ⅰ", level: 1, hidden: true,
    noteProduct: "TODO: 等待产品确认\"按提示词分类\"系列（Ⅰ~Ⅳ）的阈值、分类维度、分级命名，暂不展示",
    description: "按提示词分类达到 N 次（TODO：N 待产品确认）",
    metric: "aiPromptCategorized", threshold: 1 },
  { id: "ai_prompt_cat_2", category: "ai", name: "按提示词分类Ⅱ", level: 2, hidden: true,
    noteProduct: "TODO: 等待产品确认\"按提示词分类\"系列（Ⅰ~Ⅳ）的阈值、分类维度、分级命名，暂不展示",
    description: "按提示词分类达到 N 次（TODO：N 待产品确认）",
    metric: "aiPromptCategorized", threshold: 1 },
  { id: "ai_prompt_cat_3", category: "ai", name: "按提示词分类Ⅲ", level: 3, hidden: true,
    noteProduct: "TODO: 等待产品确认\"按提示词分类\"系列（Ⅰ~Ⅳ）的阈值、分类维度、分级命名，暂不展示",
    description: "按提示词分类达到 N 次（TODO：N 待产品确认）",
    metric: "aiPromptCategorized", threshold: 1 },
  { id: "ai_prompt_cat_4", category: "ai", name: "按提示词分类Ⅳ", level: 4, hidden: true,
    noteProduct: "TODO: 等待产品确认\"按提示词分类\"系列（Ⅰ~Ⅳ）的阈值、分类维度、分级命名，暂不展示",
    description: "按提示词分类达到 N 次（TODO：N 待产品确认）",
    metric: "aiPromptCategorized", threshold: 1 },
];

/* ---------- 指标清单（用于事件 → 局部重算映射） ---------- */
export const METRIC_TO_CATEGORIES = {
  activeStudyDays: ["streak"],
  startedSubjects: ["subject"],
  completedTcmSubjects: ["subject"],
  completedWesternSubjects: ["subject"],
  perfectDays: ["plan"],
  perfectWeeks: ["plan"],
  perfectMonths: ["plan"],
  commentsTotal: ["knowledge"],
  commentsLiked10: ["knowledge"],
  knowledgeLinks: ["knowledge"],
  masteredKps: ["knowledge"],
  materia_medicaHours: ["specialty"],
  shang_hanHours: ["specialty"],
  nei_jingHours: ["specialty"],
  jin_guiHours: ["specialty"],
  aiAnsweredQuestions: ["ai"],
  aiAccurateFeedbacks: ["ai"],
  aiInaccurateFeedbacks: ["ai"],
  aiCorrections: ["ai"],
  aiDetailFollowups: ["ai"],
  aiSyndromeQuestions: ["ai"],
};

/* 分类 → 全部成就 ID 过滤（按 category 取） */
export function getDefinitionsByCategory(catKey) {
  return ACHIEVEMENT_DEFINITIONS.filter((d) => (catKey === "all" ? true : d.category === catKey));
}
export function getVisibleDefinitionsByCategory(catKey) {
  return getDefinitionsByCategory(catKey).filter((d) => !d.hidden);
}

/* ---------- 分类统计（不算 hidden 的） ---------- */
export function countTotalVisible() {
  return ACHIEVEMENT_DEFINITIONS.filter((d) => !d.hidden).length;
}
export function countByCategory() {
  const map = { all: 0, streak: 0, subject: 0, plan: 0, knowledge: 0, specialty: 0, ai: 0 };
  for (const d of ACHIEVEMENT_DEFINITIONS) {
    if (d.hidden) continue;
    map.all++;
    if (map[d.category] != null) map[d.category]++;
  }
  return map;
}
