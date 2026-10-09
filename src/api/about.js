/* ============================================================
 * 学医智用 · 关于页 Mock API
 *  - 新功能前瞻
 *  - 团队成员介绍（独立 mock 数据）
 *  - 致谢名单
 *  - 加入我们（招聘/志愿者/联系邮箱占位）
 * ============================================================ */
import { mockResponse } from "./index.js";

/* ---- 成员团队独立 mock 数据 ---- */
export const TEAM_MEMBERS = [
  {
    nickname: "杏林叶子",
    role: "产品负责人",
    responsible: "需求梳理、路线图、学习模式与成就系统",
    profile: "待补充",
  },
  {
    nickname: "橘井同仁",
    role: "前端负责人",
    responsible: "Web 前端、移动端适配、交互实现",
    profile: "待补充",
  },
  {
    nickname: "悬壶行者",
    role: "后端负责人",
    responsible: "服务端架构、数据接口、权限系统",
    profile: "待补充",
  },
  {
    nickname: "青囊书童",
    role: "中医内容专家",
    responsible: "课程内容设计、知识点校验、AI 风格体系",
    profile: "待补充",
  },
  {
    nickname: "厚朴匠人",
    role: "UI/UX 设计",
    responsible: "绿色中医风格、组件规范、视觉体系",
    profile: "待补充",
  },
  {
    nickname: "半夏时光",
    role: "AI 策略 / 提示词",
    responsible: "9 种 AI 回答风格、辨证提问模板",
    profile: "待补充",
  },
];

/* ---- 新功能前瞻（版本号 / 状态 / 说明） ---- */
const ROADMAP = [
  {
    version: "v0.7 · 近期待发布",
    status: "开发中",
    items: [
      "离线缓存：无网环境下继续浏览已下载的知识点与笔记",
      "AI 角色扮演：名医视角讲解（仲景、华佗、李时珍、傅青主…）",
      "学习报告导出：周报/月报一键导出 PDF",
    ],
  },
  {
    version: "v0.8 · 中短期规划",
    status: "规划中",
    items: [
      "协作学习小组：组队刷题、互相批改处方、小组成就",
      "病例练习库：辨证题 / 鉴别题 / 处方题 + 智能讲解",
      "经典原文精读：黄帝内经、伤寒论、金匮逐条注解 + AI 白话",
    ],
  },
  {
    version: "v1.0 · 正式版目标",
    status: "远景",
    items: [
      "多端同步：Web / 小程序 / App 数据互通（账号 + 学习进度 + 笔记）",
      "真实老师入驻：执业中医师答疑 1v1 & 批改医案",
      "执业医师 / 执业药师考试冲刺包：真题 + 押题 + 错题再练",
    ],
  },
];

/* ---- 致谢名单 ---- */
const ACKNOWLEDGEMENTS = [
  { name: "待补充（项目贡献者 · 个人）", note: "功能建议 / Bug 反馈 / 内测体验" },
  { name: "待补充（机构 / 高校 / 社团）", note: "内容审定 / 推广支持 / 合作共建" },
  { name: "开源与社区", note: "Vue · Vite · Volar · ViteTest 及所有我们依赖过的开源项目" },
  { name: "历代中医先贤", note: "神农、黄帝、仲景、华佗、葛洪、孙思邈、李时珍、傅青主 …  薪火相传" },
];

/* ---- 加入我们 ---- */
const JOIN_US = {
  positions: [
    { title: "前端开发（志愿者 / 兼职）", requirement: "Vue3 / Taro，熟悉组件化；中医背景加分", contact: "待补充" },
    { title: "后端 / 算法（志愿者 / 兼职）", requirement: "Node.js / Python，熟悉 LLM Prompt 工程", contact: "待补充" },
    { title: "中医内容志愿者", requirement: "中医在校 / 执业人士，愿意参与校稿 / 出考题", contact: "待补充" },
    { title: "UI 设计（志愿者 / 兼职）", requirement: "国风 / 中医风格审美，移动端设计经验", contact: "待补充" },
  ],
  howTo: "请前往「咨询与反馈」页面，选择『合作 / 加入我们』并留下联系方式，我们会在 3 个工作日内回复。",
  disclaimer: "当前为 Mock 占位，不构成真实招聘承诺或劳动合同邀约。",
};

/* ---- 对外 Mock API ---- */
export function getAboutRoadmap() {
  return mockResponse(() => ({ list: ROADMAP }), 120);
}

export function getTeamMembers() {
  return mockResponse(() => ({ list: TEAM_MEMBERS }), 100);
}

export function getAcknowledgements() {
  return mockResponse(() => ({ list: ACKNOWLEDGEMENTS }), 100);
}

export function getJoinUsInfo() {
  return mockResponse(() => JOIN_US, 100);
}

export function getAboutAll() {
  return mockResponse(() => ({
    roadmap: ROADMAP,
    team: TEAM_MEMBERS,
    acknowledgements: ACKNOWLEDGEMENTS,
    joinUs: JOIN_US,
  }), 180);
}
