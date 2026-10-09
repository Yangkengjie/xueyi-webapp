/* ============================================================
 * mock/team.js — 团队介绍独立数据
 * 禁止编造真实姓名/邮箱/电话，未填写处统一用"待补充"占位
 * ============================================================ */

export const TEAM_MEMBERS = [
  {
    id: "m001",
    nickname: "待补充",
    role: "产品负责人",
    responsible: "需求规划、功能设计、进度统筹",
    bio: "待补充",
  },
  {
    id: "m002",
    nickname: "待补充",
    role: "前端主程",
    responsible: "Vue 架构、页面开发、移动端适配",
    bio: "待补充",
  },
  {
    id: "m003",
    nickname: "待补充",
    role: "后端架构",
    responsible: "服务端接口、存储与权限体系",
    bio: "待补充",
  },
  {
    id: "m004",
    nickname: "待补充",
    role: "中医内容专家",
    responsible: "经典内容审核、医案整理、题库设计",
    bio: "待补充",
  },
  {
    id: "m005",
    nickname: "待补充",
    role: "AI 研发",
    responsible: "问答模型、学习画像、个性化推荐",
    bio: "待补充",
  },
  {
    id: "m006",
    nickname: "待补充",
    role: "视觉设计",
    responsible: "中医绿色视觉体系、组件与动效",
    bio: "待补充",
  },
];

/* 致谢：外部贡献者/灵感来源 */
export const ACKNOWLEDGMENTS = [
  { id: "a001", name: "待补充", role: "开源社区贡献", note: "待补充" },
  { id: "a002", name: "待补充", role: "早期测试用户", note: "待补充" },
  { id: "a003", name: "待补充", role: "教材与参考资料", note: "待补充" },
];

/* 新功能前瞻（Roadmap） */
export const ROADMAP = [
  { phase: "v1.1（短期）", items: [
      "社区互助问答：学霸互助 + 导师答疑",
      "错题本：自动归档错题并定期提醒",
      "自定义每日打卡：支持自定义打卡主题",
  ]},
  { phase: "v1.2（中期）", items: [
      "背诵模式：间隔重复（SM-2）算法",
      "课程商城：名师公开课",
      "全真模拟考试：按真实统考环境出题",
  ]},
  { phase: "v2.0（长期）", items: [
      "临床虚拟轮转：模拟门诊/病房诊疗全过程",
      "开放平台：第三方内容与插件生态",
      "多端同步：PC / 小程序 / 平板协同学习",
  ]},
];

/* 加入我们：招聘岗位（演示用） */
export const JOIN_US = [
  { title: "中医内容编辑", desc: "整理教材、医案与题库，要求中医相关专业", contact: "待补充" },
  { title: "前端工程师（移动端）", desc: "Vue / Vite / 组件体系，追求体验与性能", contact: "待补充" },
  { title: "大模型应用工程师", desc: "熟悉 RAG、Agent、Prompt Engineering", contact: "待补充" },
  { title: "志愿者（翻译 / 校对）", desc: "中医英语翻译、繁体中文本地化", contact: "待补充" },
];
