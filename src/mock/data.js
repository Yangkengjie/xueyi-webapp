/* ============================================================
 * 学医智用 · Mock 数据（MVP 前端演示数据）
 * ============================================================ */

/* ---- 首页：今日任务 ---- */
export const defaultTasks = [
  { id: 1, text: "背诵《伤寒论》一级条文5条", done: true },
  { id: 2, text: "做《内科学》第一章练习题并改错", done: false },
  { id: 3, text: "做《内科学》第二章练习题并改错", done: false },
];

export const historyTasks = [
  { date: "星期四，3月19日", items: ["复习内经二级条文60-65", "复习内经二级条文60-65", "复习内经二级条文60-65"] },
  { date: "星期三，3月18日", items: ["学习内经二级条文60-65"] },
];

export const continueStudy = ["《方剂学·解表剂》", "《内经》"];

export const homeStatus = {
  streakDays: 12,
  rhythm: "稳定",
  bars: [55, 70, 95, 80, 30, 45, 35, 55, 90, 60],
  nextAchievement: "博览群书",
  progress: 57,
  total: 60,
};

/* ---- 推演：AI 答疑 ---- */
export const answerSample = {
  id: "a1",
  title: "如何理解汗出偏沮？",
  sections: [
    {
      heading: "第二阶段：逆于肉理（病理产物形成）",
      bullets: [
        "这是最关键的一步。被阻塞的营气（及其所化生的血液）无法前进，便从脉道中“逆乱”而出，溢于、壅滞于“肉理”（肌肉腠理）这个层次。",
        "这些本该是营养物质的营血，**一旦停滞不动，就变成了病理产物**。它郁结在局部，成为“瘀血”和“郁热”。",
      ],
    },
    {
      heading: "第三阶段：乃生痈肿（器质性病变）",
      bullets: [
        "瘀血和郁热相互搏结，越积越多。",
        "**郁久化火**：停滞的营血会郁而化热，产生“火毒”。",
        "**热盛肉腐**：火毒炽盛，会灼伤、腐蚀局部的肌肉血脉，使之腐败，从而“化腐成脓”。",
        "最终，在局部形成一个具有红（充血）、肿（气血壅滞）、热（火毒）、痛（气血不通）特征的病灶，这就是“痈肿”。",
      ],
    },
  ],
};

export const planSample = {
  id: "p1",
  title: "中医基础理论备考规划",
  sections: [
    {
      heading: "第一阶段：夯实基础（7天）",
      bullets: [
        "每天学习 60～90 分钟，优先复习藏象、精气血津液和经络。",
        "完成每个章节后的基础练习，并整理 3～5 个易错知识点。",
      ],
    },
    {
      heading: "第二阶段：强化联系（7天）",
      bullets: [
        "结合知识图谱复习脏腑之间的关系，建立知识点之间的关联。",
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

export const chatHistory = [
  { group: "昨天", items: ["湿疹的形成原因", "湿疹的形成原因", "中药清心凉血功效解析"] },
  { group: "6.6", items: ["嗅觉与味觉感知木头味", "针灸学重点知识梳理", "湿热蕴肤及文氏湿疹用药分析"] },
  { group: "6.1", items: ["为什么晨跑更好？", "穴位敏化的临界点在哪儿", "婴儿感觉不到味道吗？"] },
  { group: "近一个月", items: ["中气缓的生理与病理解析", "治痿独取阳明解析", "正治与反治原则"] },
  { group: "2.1", items: ["内经二级条文重点及关键字词分析与…", "为什么过喜则气缓", "为什么悲则气消？"] },
  { group: "2025.12.31", items: ["中气缓的生理与病理解析", "治痿独取阳明解析"] },
];

/* ---- 学习：课程 / 大纲 / 图谱 ---- */
export const courses = [
  { id: "tcm-basic", name: "中医基础理论", desc: "中医学哲学基础 · 藏象 · 精气血津液 · 经络", progress: 68 },
  { id: "tcm-diag", name: "中医诊断学", desc: "望闻问切 · 八纲辨证 · 证候与辨证", progress: 42 },
  { id: "tcm-materia", name: "中药学", desc: "中药基本理论 · 各类中药 · 功效主治", progress: 35 },
  { id: "anatomy", name: "人体解剖学", desc: "运动 · 消化 · 呼吸 · 泌尿 · 循环 · 神经等系统", progress: 28 },
];

/* 课程大纲树（思维导图） */
export const courseOutline = {
  name: "中医基础理论",
  children: [
    {
      name: "藏象",
      children: [
        { name: "五脏", children: [{ name: "脾" }, { name: "肝" }, { name: "肾" }] },
        {
          name: "六腑",
          children: [
            { name: "胆（贮藏排泄胆汁，主决断）" },
            { name: "胃（受纳腐熟水谷，主通降）" },
            { name: "小肠（泌别清浊）" },
            { name: "大肠（传导糟粕）" },
            { name: "膀胱（贮尿排尿）" },
            { name: "三焦（通行元气，运行水液）" },
          ],
        },
        {
          name: "奇恒之腑",
          children: [
            { name: "脑（髓海，元神之府）" },
            { name: "髓" },
            { name: "骨" },
            { name: "脉" },
            { name: "胆" },
            { name: "女子胞（主月经，孕育胎儿）" },
          ],
        },
        {
          name: "脏腑之间的关系",
          children: [{ name: "五脏之间的关系" }, { name: "六腑之间的关系" }, { name: "五脏与六腑的表里关系" }],
        },
      ],
    },
    {
      name: "精",
      children: [{ name: "精的基本概念" }, { name: "精的生成与功能" }],
    },
    {
      name: "气",
      children: [
        { name: "气的概念与生成" },
        { name: "气的功能（推动、温煦…）" },
        { name: "气的分类与分布" },
        { name: "气的运行（气机）" },
      ],
    },
  ],
};

/* 知识点大纲详情（脾） */
export const topicDetail = {
  course: "中医基础理论",
  commentCount: 128,
  tree: [
    { id: "xin", text: "心（阳中之太阳）", children: [] },
    { id: "fei", text: "肺（阳中之少阴）", children: [] },
    {
      id: "pi",
      text: "脾（阴中之至阴）",
      children: [
        {
          id: "pi-func",
          text: "生理功能",
          children: [
            {
              id: "pi-yunhua",
              text: "主运化",
              highlight: true,
              links: ["足太阴脾经", "肝血虚"],
              desc: "指脾气将饮食水谷化为水谷精微，并将其吸收、转输到全身的脏腑机能",
              children: [
                {
                  id: "pi-shuigu",
                  text: "运化水谷",
                  desc: "指脾气将谷食化为谷精，并将其吸收、转输到全身的脏腑机能",
                  children: [
                    {
                      id: "pi-yuanli",
                      text: "工作原理",
                      children: [
                        { id: "pi-p1", text: "谷食入胃，经胃腐熟后，变为食糜，下传于小肠以作进一步消化", note: "经脾气的推动、激发作用" },
                        { id: "pi-p2", text: "小肠中的食糜，在脾气的作用下进一步消化后，分为清浊两部分" },
                        { id: "pi-p3", text: "其精微部分，在脾气的作用下由小肠吸收，再经脾气的转输作用输送全身" },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/* 弱关联点击后浮层内容 */
export const weakLinkPanels = {
  肝血虚: {
    title: "病案分析",
    tag: "@肝血虚",
    body: "病人主诉，详细病情，既往史等等，一大堆描述路过中一大堆描述路过中一大堆描述路过中一大堆描述路过中一大堆描述路过中。",
    diagnosis: ["中医诊断：肝血虚", "西医诊断：某种病"],
    extra: "经络循行，巴拉巴拉巴拉。经络循行，巴拉巴拉巴拉。经络循行，巴拉巴拉巴拉。经络循行，巴拉巴拉巴拉。经络循行，巴拉巴拉巴拉。",
  },
  足太阴脾经: {
    title: "经络条文",
    tag: "@足太阴脾经",
    body: "脾足太阴之脉，起于大指之端，循指内侧白肉际，过核骨后，上内踝前廉，上踹内，循胫骨后，交出厥阴之前，上膝股内前廉，入腹，属脾，络胃。",
    diagnosis: [],
    extra: "循行部位：足大趾内侧 → 内踝 → 小腿内侧 → 股内侧 → 腹部。",
  },
};

/* 关联搜索候选 */
export const linkSearchPool = [
  { title: "肝肾同源的实例", cat: "课程框架" },
  { title: "肝血虚", cat: "案例研习" },
  { title: "肝血虚", cat: "病案分析" },
  { title: "肝血虚", cat: "病案分析" },
  { title: "肝血虚", cat: "病案分析" },
];

/* 知识速查联想 */
export const searchSuggest = ["脾主忧思", "脾胃为气血生化之源", "脾不统血", "归脾汤", "实脾饮"];
export const searchHistory = ["脾主忧思", "冲脉穴位", "肺喜乐无极则伤魄", "百会穴", "上之下之", "玉屏风散", "内经二级条文", "龙胆泻肝汤", "梅核气", "枸杞原浆"];

/* ---- 知识图谱 ---- */
export const graphNodes = [
  { id: "pi", label: "脾", x: 165, y: 310, r: 34, color: "green", desc: "脾主运化，为后天之本，气血生化之源。开窍于口，其华在唇。" },
  { id: "biaoli", label: "表里", x: 235, y: 190, r: 24, color: "blue", desc: "表里辨证：辨别病变部位深浅与病势进退的纲领。" },
  { id: "zhifa", label: "治法", x: 190, y: 430, r: 24, color: "green-l", desc: "代表方：常用方药。健脾益气、燥湿利水为基本治法。" },
  { id: "zhifa2", label: "治法", x: 265, y: 420, r: 22, color: "blue", desc: "代表方：常用药。四君子汤、参苓白术散加减。" },
  { id: "bingwei", label: "病位", x: 125, y: 195, r: 24, color: "orange", desc: "外感湿邪、饮食不调、情志失调、劳逸过度皆可伤脾。" },
  { id: "dingzheng", label: "定证", x: 120, y: 405, r: 26, color: "orange", desc: "脾气虚证、脾阳虚证、脾不统血证、湿热蕴脾证。" },
  { id: "shizheng", label: "实证", x: 310, y: 255, r: 22, color: "green-l", desc: "运化失常、升清失司所致诸实证。" },
  { id: "dingzheng2", label: "定证", x: 305, y: 375, r: 24, color: "green-l", desc: "开清失司、统血无权、湿浊内停之定证。" },
  { id: "zhuzang", label: "主脏", x: 320, y: 190, r: 24, color: "orange", desc: "脾与胃相表里，为气血生化之源。" },
  { id: "jingdian", label: "经典", x: 315, y: 440, r: 24, color: "blue", desc: "《素问》《灵枢》《脾胃论》相关论述。" },
];

export const graphEdges = [
  ["pi", "biaoli", "#e59a4b"],
  ["pi", "zhifa", "#a9d6a4"],
  ["pi", "zhifa2", "#4b8fd6"],
  ["pi", "bingwei", "#e59a4b"],
  ["pi", "dingzheng", "#e59a4b"],
  ["pi", "shizheng", "#c9c9c6"],
  ["pi", "dingzheng2", "#c9c9c6"],
  ["biaoli", "zhuzang", "#c9c9c6"],
  ["zhuzang", "shizheng", "#a9d6a4"],
  ["dingzheng2", "jingdian", "#4b8fd6"],
  ["shizheng", "dingzheng2", "#c9c9c6"],
];

export const graphFilters = ["显示全部", "显示方药", "显示案例", "显示经穴", "显示资源", "显示知识点", "显示不熟", "显示掌握", "显示熟悉", "显示了解"];

/* ---- 评论区 ---- */
export const comments = [
  {
    id: 1,
    name: "我是张三",
    text: "脾是后天根本，气血全靠它造。想不出来了还有什么评论凑字数吧哈哈哈。张三李四还有老王，天蓝色的雨。杨丞琳的雨爱是自己写的吗",
    likes: 19,
    replies: { author: "大梦先觉", text: "biubiubiubiubiubiu", total: 19 },
  },
  { id: 2, name: "家有萌娃", text: "脾负责消化食物，滋养全身。", likes: 0, replies: { author: "大梦先觉", text: "biubiubiubiubiubiu", total: 19 } },
  { id: 3, name: "地道酸黄瓜", text: "脾怕湿，生冷甜腻要少吃。", likes: 0, replies: null },
  { id: 4, name: "鄢陵你的祥哥", text: "脾往上送营养，胃往下排糟粕，俩好搭档。", likes: 0, replies: { author: "大梦先觉", text: "biubiubiubiubiubiuunlasting world the course of love everything thin…", total: 19 } },
];

/* ---- 我的收藏 ---- */
export const favComments = [
  { id: 1, name: "咫", text: "一问寒热二问汗，三问头身四问便，五问饮食六问便，七聋八渴俱当辨，九问旧病十…", tag: "中医诊断学：问诊" },
  { id: 2, name: "嚣张张", text: "裂纹舌就是气血无法滋养舌面，要么就是长期生成不足、或气血被消耗，要么就是通道堵塞", tag: "中医诊断学：望舌" },
  { id: 3, name: "名人不放暗屁", text: "外感和食积常常相互影响", tag: "中医基础理论：脾" },
  { id: 4, name: "西红柿炒番茄", text: "现在肚子平了 甚至瘪了", tag: "中医基础理论：脾" },
  { id: 5, name: "every garden", text: "脾不升清，眼皮下陷。阳虚（心/脾）--便意频频，清气在下浊气在上。（心衰、晕车）", tag: "中医基础理论：脾" },
  { id: 6, name: "旧书藏月光", text: "我超级喜欢中医 不知道这个年纪学习来不来的及 看针还是害怕的🥰", tag: "中医基础理论：脾" },
];

export const favAnswers = [
  { id: 1, title: "经期舌象中医辨证分析", text: "血虚虚火常见：除舌红外，常伴有经量少、色淡质稀，以及头晕心悸、失眠多梦、面色苍白或萎黄。治疗重在养血，血充则火自降。切忌滥用苦寒泻火药，虚火上炎：肾阴虚火旺：循咽喉夹舌本，心阴虚火旺：舌尖与面部，午后颧骨潮红，肺阴虚火旺：鼻咽部，肝：双…" },
  { id: 2, title: "阴分伏热病机", text: "血虚虚火常见：除舌红外，常伴有经量少、色淡质稀，以及头晕心悸、失眠多梦、面色苍白或萎黄。治疗重在养血，血充则火自降。切忌滥用苦寒泻火药，虚火上炎：肾阴虚火旺：循咽喉夹舌本，心阴虚火旺：舌尖与面…" },
  { id: 3, title: "表虚证自汗，玄府未开", text: "血虚虚火常见：除舌红外，常伴有经量少、色淡质稀，以及头晕心悸、失眠多梦、面色苍白或萎黄。治疗重在养血，血充则火自降。切忌滥用苦寒泻火药，虚火上炎：肾阴虚火旺：循咽喉夹舌本，心阴虚火旺：舌尖与面…" },
  { id: 4, title: "水湿痰饮的区别", text: "血虚虚火常见：除舌红外，常伴有经量少、色淡质稀，以及头晕心悸、失眠多梦、面色苍白或萎黄。治疗重在养血，血充则火自降。切忌滥用苦寒泻火药，虚火上炎：肾阴虚火旺：循咽喉夹舌本，心阴虚火旺：舌尖与面…" },
];

/* ---- 学习历程 ---- */
export const journey = {
  days: [
    { d: "8.07", w: "周四" },
    { d: "8.08", w: "周五" },
    { d: "8.09", w: "周六" },
    { d: "8.10", w: "周日" },
    { d: "8.11", w: "今日" },
  ],
  goalDone: 4,
  goalTotal: 8,
  minutes: 120,
  mood: "🔥 手感火热",
  moodNote: "专注力满分，继续保持",
  subjects: [
    { name: "方剂学", min: 30 },
    { name: "内经", min: 45 },
    { name: "针灸学", min: 20 },
    { name: "练习", min: 25 },
  ],
  advice: "方剂配伍关系掌握得不错，可以尝试更多方剂辨析题哦~",
  title: { name: "猫头鹰学习者", motto: "“诚心守正，光明学通”", streak: 23 },
  trend: [0.8, 1.4, 1.0, 1.6, 1.3, 1.1, 2.0],
  trendDays: ["8.05", "8.06", "8.07", "8.08", "8.09", "8.10", "8.11"],
  totalHours: 286,
  stats: [
    { label: "日均学习时长", value: "2.0", unit: "小时" },
    { label: "学习总天数", value: "127", unit: "天" },
    { label: "最长连续学习", value: "23", unit: "天" },
  ],
  achievements: [
    { name: "初入杏林", cond: "累计学习 10 小时" },
    { name: "博览群书", cond: "累计学习 100 小时" },
    { name: "只言片语", cond: "累计学习 30 小时" },
    { name: "福尔摩斯", cond: "累计完成 20 次诊断推理" },
    { name: "小试牛刀", cond: "累计学习 50 小时" },
    { name: "膜拜大佬", cond: "累计完成 50 次知识挑战" },
  ],
};

/* ---- 设置：回答风格 ---- */
export const answerStyles = [
  { key: "A", name: "直接精准模式", note: "优先给出简洁答案" },
  { key: "B", name: "引导式对话", note: "通过提问引导思考" },
  { key: "C", name: "知识图谱模式", note: "用图像呈现知识结构" },
  { key: "D", name: "临床案例模式", note: "附真实医案解读" },
  { key: "E", name: "通俗类比模式", note: "用生活例子解释" },
  { key: "F", name: "古籍溯源模式", note: "引用原文及出处" },
  { key: "G", name: "各家学说模式", note: "梳理历代医家观点" },
  { key: "H", name: "现代研究模式", note: "结合现代临床研究" },
  { key: "I", name: "方药详解模式", note: "附具体方药分析" },
];

/* ---- 咨询与反馈 ---- */
export const faqConsult = [
  { q: "如何使用关联功能？", a: "在大纲编辑模式下点击工具栏的 @ 按钮，搜索并选择要关联的知识点即可建立弱关联。" },
  { q: "如何切换学习 / 备考模式？", a: "首页中部的模式开关即可切换，备考模式下将聚焦「今日复习」任务。" },
  { q: "如何查看历史问答？", a: "推演页点击左上角「历史记录」，或在「我的」中进入历史记录。" },
  { q: "如何导出自己的学习数据？", a: "进入 我的 → 学习历程 → 查看全部，可查看完整数据，导出功能正在开发中。" },
  { q: "收藏的内容在哪里查看？", a: "我的 → 我的收藏，支持收藏评论与 AI 回答两类内容。" },
];

/* ---- 个人资料 ---- */
export const profileRows = [
  { key: "nickname", label: "昵称", value: "岐黄学子", editable: true },
  { key: "id", label: "ID", value: "2024001", editable: false },
  { key: "persona", label: "个人画像", value: "体系构建师", editable: true },
  { key: "school", label: "学校", value: "成都中医药大学", editable: true },
  { key: "major", label: "专业", value: "中医学5年制", editable: true },
  { key: "grade", label: "年级", value: "大一", editable: true },
  { key: "gender", label: "性别", value: "女", editable: true },
];

/* ---- 学习者画像 ---- */
export const personaRadar = {
  axes: ["记忆型", "理解型", "应用型", "分析型"],
  values: [0.75, 0.9, 0.6, 0.8],
};

/* ---- 系统通知 ---- */
export const notices = [
  {
    title: "系统更新通知",
    date: "2024.03.15",
    body: "我们更新了知识图谱的交互体验，优化了弱关联的展示，快去试试吧！",
  },
];

/* ---- 学习资源中心：知识库内容入口 ---- */
export const learningModules = [
  { id: 'framework', name: '课程框架', desc: '按课程与章节系统学习', icon: '▦', tone: 'green' },
  { id: 'case', name: '案例研习', desc: '从真实问题训练辨证思路', icon: '◉', tone: 'orange' },
  { id: 'formula', name: '方药宝典', desc: '常用方剂与中药知识速查', icon: '✚', tone: 'blue' },
  { id: 'classic', name: '经典深读', desc: '围绕经典原文理解医理', icon: '▤', tone: 'purple' },
  { id: 'meridian', name: '经络穴位', desc: '经络循行与常用穴位学习', icon: '⌁', tone: 'teal' },
];

export const learningResources = {
  framework: [
    { title: '中医基础理论', meta: '中医学哲学基础 · 藏象 · 精气血津液 · 经络', progress: 68, courseId: 'tcm-basic' },
    { title: '中医诊断学', meta: '望闻问切 · 八纲辨证 · 证候与辨证', progress: 42, courseId: 'tcm-diag' },
    { title: '中药学', meta: '中药基本理论 · 各类中药 · 功效主治', progress: 35, courseId: 'tcm-materia' },
    { title: '人体解剖学', meta: '运动 · 消化 · 呼吸 · 泌尿 · 循环 · 神经等系统', progress: 28, courseId: 'anatomy' },
  ],
  case: [
    { title: '肝血虚辨证分析', meta: '从主诉、舌脉到病机判断', tag: '辨证训练' },
    { title: '湿疹病机推演', meta: '湿邪、热邪与肌肤病变', tag: '病案分析' },
    { title: '脾虚湿困案例', meta: '围绕运化失司建立辨证链条', tag: '案例研习' },
  ],
  formula: [
    { title: '四君子汤', meta: '益气健脾 · 脾胃气虚', tag: '补益剂' },
    { title: '归脾汤', meta: '益气补血 · 健脾养心', tag: '补益剂' },
    { title: '龙胆泻肝汤', meta: '清肝胆实火 · 利湿热', tag: '清热剂' },
  ],
  classic: [
    { title: '《素问》阴阳应象大论', meta: '从阴阳关系理解生理病理', tag: '经典条文' },
    { title: '《灵枢》经脉篇', meta: '经络系统与循行规律', tag: '经典条文' },
    { title: '《内经》二级条文重点', meta: '关键词与临床意义梳理', tag: '重点深读' },
  ],
  meridian: [
    { title: '足太阴脾经', meta: '循行 · 主治 · 常用穴位', tag: '经络' },
    { title: '足阳明胃经', meta: '循行 · 主治 · 常用穴位', tag: '经络' },
    { title: '百会穴', meta: '定位 · 主治 · 配伍', tag: '穴位' },
  ],
  navigation: [
    { title: '知识图谱模式', meta: '从关系网络探索知识点', routeName: 'graph' },
    { title: '知识速查', meta: '按关键词快速检索知识', routeName: 'quickSearch' },
    { title: '课程大纲', meta: '以思维导图查看知识结构', routeName: 'course', courseId: 'tcm-basic' },
  ],
};
