/* ============================================================
 * 学医智用 · 成就图标映射（原创内联 SVG 映射表
 * 只做映射与图案枚举；不重定义；不重定义；不重定义；
 * - CATEGORY_ICONS: 分类小图标（18px 线性）
 * - ACHIEVEMENT_ICON_MAP: 成就 id → 图案类型（g_shape）
 * - ACHIEVEMENT_ICON_BACKFALL: 未知成就备用（医书嫩芽）
 * 统一设计参数（设计规范：
 *   viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"
 *   默认线宽 1.6（成就徽章 1.75，分类图标 1.6）
 * 颜色由组件层：由组件层用 CSS var 决定，不在 SVG 内写死颜色。
 * ============================================================ */

/* --------- 1. 分类小图标（Category SVG 原始 SVG，组件会套色） --------- */
// 组件会在 SVG 外层 g 上打 class 以便 currentColor 继承，所以直接 return 内联路径即可。
export const CATEGORY_ICON_SVGS = {
  // 全部：六瓣简化花形 / 圆形总览标记（非奖杯）
  all: /*html*/`
    <circle cx="12" cy="12" r="8.2" />
    <g >
      <path d="M12 3.8 C13.2 5.6 10.8 5.6 12 3.8 Z" />
      <path d="M20.2 12 C18.4 13.2 18.4 10.8 20.2 12 Z" />
      <path d="M12 20.2 C10.8 18.4 13.2 18.4 12 20.2 Z" />
      <path d="M3.8 12 C5.6 10.8 5.6 13.2 3.8 12 Z" />
      <path d="M18.2 5.8 C16.6 7.2 17 5.8 18.2 5.8 Z" transform="rotate(0 12 12)" />
      <path d="M18.2 18.2 C17 16.8 16.6 18.2 18.2 18.2 Z" />
      <path d="M5.8 18.2 C7.2 16.6 5.8 17 5.8 18.2 Z" />
      <path d="M5.8 5.8 C7 7.2 7.4 5.8 5.8 5.8 Z" />
    </g>
    <circle cx="12" cy="12" r="2" />
  `,

  // 学习天数：嫩芽 + 简化日轮（日轮在上、嫩芽在下）
  streak: /*html*/`
    <circle cx="12" cy="7" r="2.6" />
    <path d="M12 9.6 V17" />
    <path d="M9.4 14.4 C11.2 13.2 10.4 11.8 8.8 12.8 C8.2 15 10 15.8 12 15.2" />
    <path d="M14.6 12.2 C12.8 11 13.6 9.8 15.2 10.8 C15.8 13 14 13.8 12 13.2" />
    <path d="M8 18 H16" stroke-linecap="round" />
  `,

  // 科目：两册叠放的医书
  subject: /*html*/`
    <path d="M5 5.6 H15.4 A1.2 1.2 0 0 1 16.6 6.8 V14.8 H6.2 A1.2 1.2 0 0 1 5 13.6 Z" />
    <path d="M5 12 H16.6" />
    <path d="M7.4 8.2 H14.2" />
    <path d="M8.8 18.4 H19 A1.2 1.2 0 0 0 20.2 17.2 V9.2" />
    <path d="M8.8 18.4 V10.4 A1.2 1.2 0 0 1 10 9.2 H20.2" />
    <path d="M11 15.6 H19" />
  `,

  // 计划：简洁日历 + 右上角勾选
  plan: /*html*/`
    <rect x="4.4" y="5.6" width="15.2" height="14" rx="2" />
    <path d="M8.2 4 V7.2 M15.8 4 V7.2 M4.4 10 H19.6" />
    <path d="M8 13 L10.4 15.2 L16 10" transform="translate(0 0.2)" />
  `,

  // 知识互动：三节点 + 连接线（三角连接）
  knowledge: /*html*/`
    <circle cx="12" cy="6" r="2" />
    <circle cx="6.2" cy="17" r="2" />
    <circle cx="17.8" cy="17" r="2" />
    <path d="M10.4 7.6 L7.6 15.4" />
    <path d="M13.6 7.6 L16.4 15.4" />
    <path d="M8.2 15 H15.8" />
  `,

  // 专项学习：展开的古籍 + 右上角一片药草
  specialty: /*html*/`
    <path d="M3.8 7 C3.8 6.4 4.4 6 5 6 H12 H19 C19.6 6 20.2 6.4 20.2 7 V17.8 C20.2 18.4 19.6 18.8 19 18.8 H12 H5 C4.4 18.8 3.8 18.4 3.8 17.8 Z" />
    <path d="M12 6 V18.8" />
    <path d="M6.8 10.2 H10.4 M6.8 13 H9.6 M13.6 10.2 H17.2 M13.6 13 H16.4" />
    <path d="M17 4.4 C16.2 4.4 15.4 5 15 5.6 C15.4 4.8 14.4 4 13.4 4.2 C13.2 5.2 14.4 5.8 15.2 5.8 C15.6 5.4 15.8 5 16.2 4.8 C16.8 5 17.2 5 17.4 5.4 C17.6 4.8 17.4 4.4 17 4.4 Z" />
  `,

  // AI 互动：对话框 + 一条简化脉搏线
  ai: /*html*/`
    <path d="M5 7.4 H16.4 A1.6 1.6 0 0 1 18 9 V14.2 A1.6 1.6 0 0 1 16.4 15.8 H11.6 L8.2 19.4 L8 15.8 H5 A1.6 1.6 0 0 1 3.4 14.2 V9 A1.6 1.6 0 0 1 5 7.4 Z" />
    <path d="M6.6 11.6 L8.2 11.6 L9.4 9.4 L10.6 14 L12 10.2 L13.2 11.6 H15" />
  `,
};

/* --------- 2. 成就徽章用的图案（原始 SVG，组件会叠等级点缀/锁定套色） --------- */
export const ACHIEVEMENT_BADGE_SHAPES = {
  // 【学习天数】
  streak_sprout: /*html*/`
    <path d="M12 19 C13.6 15.6 10.4 15.6 12 12.2 C12.8 10.4 15 13 15 10.8 C15 8.2 12.8 9 12.6 6.6 C12.4 4.8 13 3.8 14.8 3.8 C12 3.8 10.6 6.2 11 9 C11.2 10.6 13 10 12.6 12.2 C10.4 16.2 10 16.6 12 19 Z" />
  `,
  streak_three_leaves: /*html*/`
    <path d="M12 19 V12" />
    <path d="M12 12 C9 10.2 8.6 7 10.8 5.2" />
    <path d="M12 12 C15 10.2 15.4 7 13.2 5.2" />
    <path d="M12 13 C8.6 12.2 6.4 14.2 8 17" />
    <path d="M12 13 C15.4 12.2 17.6 14.2 16 17" />
    <path d="M12 11 C12 11 10.2 8.6 7.6 8.8 C9.8 7.4 12.4 8.4 13.8 6.6 C13.4 9 12.4 11.2 12 11 Z" />
  `,
  streak_root: /*html*/`
    <path d="M12 18 V8" />
    <path d="M12 8 C9.2 6.8 7.8 4.2 9.2 3 C11 5.4 13 4.2 14.8 3.2 C14.2 5.4 14 6.8 12 8 Z" />
    <path d="M12 18 C9.6 18.4 8.2 20 7 20.4 C8.6 18.2 10.8 18.4 12 18 Z" />
    <path d="M12 18 C14.4 18.4 15.8 20 17 20.4 C15.4 18.2 13.2 18.4 12 18 Z" />
    <path d="M10.4 11 C9 9.6 7 10 6 10.8 C7.2 9.4 9.6 8.8 10.4 11 Z" />
    <path d="M13.6 11 C15 9.6 17 10 18 10.8 C16.8 9.4 14.4 8.8 13.6 11 Z" />
  `,
  streak_grow: /*html*/`
    <path d="M6 18 H18" />
    <path d="M7.2 7 H16 A1.4 1.4 0 0 1 17.4 8.4 V16.6 H5.8 A1.4 1.4 0 0 1 4.4 15.2 V8.4 A1.4 1.4 0 0 1 5.8 7 H7.2 Z" />
    <path d="M9.6 10.2 H13.6 M9.6 12.8 H12.6" />
    <path d="M12 10.4 C10.2 9.6 8.8 7.6 10 5.6 C12 7.2 13.2 7 14.4 5.2 C14 7.6 13.6 9.2 12 10.4 Z" transform="translate(0 -2)" />
  `,
  streak_lamp_book: /*html*/`
    <path d="M9.2 4.6 H14.8 L13.8 10 H10.2 Z" />
    <path d="M12 10 V12.8 M10.2 13 H13.8" />
    <path d="M4.8 14 H19.2 C19.2 13.4 18.2 15.2 16.6 15.6 H7.4 C5.8 15.2 4.8 13.4 4.8 14 Z" />
    <path d="M6.2 15.6 V19.2 H17.8 V15.6" />
    <path d="M9.2 17.4 H14.8" />
  `,
  streak_plum_ring: /*html*/`
    <circle cx="12" cy="12" r="8" />
    <path d="M7.2 5.4 C6.8 8.4 8.8 10.2 11.4 9.2 C9.6 11.4 10.6 13.8 12 16.2 C13.6 13.4 14.6 11.2 13 9.4 C15.2 10.8 17.2 8.8 16.6 5.8 C14.2 6.6 13.2 5.2 12 4.6 C10.6 5 10 6.4 7.2 5.4 Z" />
  `,

  // 【科目】
  sub_first_book: /*html*/`
    <path d="M5.6 5.2 H16.4 A1.4 1.4 0 0 1 17.8 6.6 V17.4 H7 A1.4 1.4 0 0 1 5.6 16 Z" />
    <path d="M5.6 11.2 H17.8 M8.2 9 H14.2 M8.2 13.2 H12.4" />
    <path d="M11.2 4.8 V17.6" />
  `,
  sub_balance: /*html*/`
    <path d="M12 4 V9.2 M12 9.2 L6.4 18.8 H17.6 Z" />
    <rect x="4.2" y="6.8" width="7.2" height="4.4" rx="1" />
    <rect x="12.6" y="6.8" width="7.2" height="4.4" rx="1" />
    <path d="M7.8 11.2 V18.4 M16.2 11.2 V18.4" />
  `,
  sub_hexa_hexa: /*html*/`
    <polygon points="12,3.8 19.2,8 19.2,16 12,20.2 4.8,16 4.8,8" />
    <circle cx="12" cy="8.6" r="1.4" />
    <circle cx="8.2" cy="12" r="1.4" />
    <circle cx="15.8" cy="12" r="1.4" />
    <circle cx="9.6" cy="16.2" r="1.4" />
    <circle cx="14.4" cy="16.2" r="1.4" />
    <circle cx="12" cy="15.4" r="1.4" />
  `,

  // 【计划】
  plan_check: /*html*/`
    <rect x="4.4" y="4.6" width="15.2" height="15.2" rx="2.4" />
    <path d="M8 3.4 V6.2 M16 3.4 V6.2 M4.4 10 H19.6" />
    <path d="M7.8 13.4 L10.4 16 L16.4 10.4" />
  `,
  plan_week_ring: /*html*/`
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="5" r="0.8" fill="currentColor" />
    <circle cx="16.9" cy="6.9" r="0.8" fill="currentColor" />
    <circle cx="19" cy="12" r="0.8" fill="currentColor" />
    <circle cx="16.9" cy="17.1" r="0.8" fill="currentColor" />
    <circle cx="12" cy="19" r="0.8" fill="currentColor" />
    <circle cx="7.1" cy="17.1" r="0.8" fill="currentColor" />
    <circle cx="5" cy="12" r="0.8" fill="currentColor" />
    <path d="M9.4 12.2 L11.4 14.2 L15 9.8" />
  `,
  plan_month_moon: /*html*/`
    <path d="M15.6 4.8 A7 7 0 1 0 19.2 12 A5.6 5.6 0 0 1 15.6 4.8 Z" />
    <rect x="4.6" y="8.2" width="13" height="11.4" rx="2.2" />
    <path d="M8 10.4 H14.2 M8 13.2 H12.6 M16 16 H19" />
    <path d="M7.4 16.2 L9 17.6 L13.8 12.8" />
  `,
  plan_sundial: /*html*/`
    <circle cx="12" cy="13.6" r="6" />
    <path d="M12 7.6 V13.6 L15.2 11" />
    <path d="M6 20 H18" />
    <path d="M12 3.6 V7.6" />
    <path d="M6.6 8 L9.4 9.8" />
    <path d="M17.4 8 L14.6 9.8" />
    <path d="M7.2 18.6 L8.6 16.2" />
    <path d="M16.8 18.6 L15.4 16.2" />
  `,
  plan_scroll: /*html*/`
    <rect x="4.4" y="7.4" width="15.2" height="10" rx="1.2" />
    <path d="M19.6 7.4 A1.8 1.8 0 0 1 19.6 11 A1.8 1.8 0 0 1 19.6 14.4" />
    <path d="M4.4 7.4 A1.8 1.8 0 0 0 4.4 11 A1.8 1.8 0 0 0 4.4 14.4" />
    <path d="M7.6 10 H16.4 M7.6 12.2 H14.8 M7.6 14.4 H16.4" />
  `,

  // 【知识互动】
  kb_comment: /*html*/`
    <path d="M4.4 6.6 H15.8 A1.6 1.6 0 0 1 17.4 8.2 V13.8 A1.6 1.6 0 0 1 15.8 15.4 H11.2 L7.4 19 L7.2 15.4 H4.4 A1.6 1.6 0 0 1 2.8 13.8 V8.2 A1.6 1.6 0 0 1 4.4 6.6 Z" />
    <path d="M6.6 9.8 H13.4 M6.6 12 H11.4" />
  `,
  kb_comment_sparkle: /*html*/`
    <path d="M4.4 6.6 H15.8 A1.6 1.6 0 0 1 17.4 8.2 V13.8 A1.6 1.6 0 0 1 15.8 15.4 H11.2 L7.4 19 L7.2 15.4 H4.4 A1.6 1.6 0 0 1 2.8 13.8 V8.2 A1.6 1.6 0 0 1 4.4 6.6 Z" />
    <path d="M6.6 9.8 H13.4 M6.6 12 H11.4" />
    <path d="M18.6 3.4 L19 2.6 L19.4 3.4 L20.2 3.8 L19.4 4.2 L19 5 L18.6 4.2 L17.8 3.8 Z" />
    <path d="M17 6.6 L17.2 6.1 L17.4 6.6 L17.9 6.8 L17.4 7 L17.2 7.5 L17 7 L16.5 6.8 Z" />
  `,
  kb_link: /*html*/`
    <circle cx="7.4" cy="8.4" r="2.2" />
    <circle cx="16.6" cy="8.4" r="2.2" />
    <circle cx="12" cy="16.8" r="2.2" />
    <path d="M9.4 9.2 L14.6 9.2 M8.6 10.2 L11 15 M15.4 10.2 L13 15" />
  `,
  kb_master: /*html*/`
    <path d="M4.8 6.8 H19.2 V15.8 H4.8 Z" />
    <path d="M4.8 10.4 H19.2 M7.4 13.4 H12.8" />
    <circle cx="17.6" cy="4.8" r="1.2" />
    <path d="M17.6 6 V9" />
    <circle cx="14.4" cy="4.4" r="0.8" />
    <circle cx="19.6" cy="7.4" r="0.8" />
  `,

  // 【专项学习】
  spe_shennong: /*html*/`
    <path d="M7 14.2 C7 11.8 8.8 10 11.2 10 C13 10 14.4 11.2 14.8 12.8 C15 11.2 16.8 10 18.4 10.6 C18.2 13.6 15.4 14.6 14.2 14.6 L14.6 16.2 H8.6 L8.6 14.2 Z" />
    <path d="M5.4 18 H19" />
    <path d="M12 16.2 V20 C10.6 18.2 13.6 18.2 12 16.2 Z" />
    <path d="M9 20 H15" transform="translate(0 -0.2)" />
    <path d="M5 18 C5 16 8 15.4 9 17.2" />
    <circle cx="9" cy="11.2" r="0.8" />
    <circle cx="11.2" cy="9.6" r="0.8" />
  `,
  spe_shanghan: /*html*/`
    <path d="M4.2 6.6 H12 H19.8 C20.4 6.6 21 7.2 21 7.8 V18 C21 18.6 20.4 19.2 19.8 19.2 H12 H4.2 C3.6 19.2 3 18.6 3 18 V7.8 C3 7.2 3.6 6.6 4.2 6.6 Z" />
    <path d="M12 6.6 V19.2" />
    <path d="M7.2 10.6 H10.8 M7.2 13.4 H9.6 M13.2 10.6 H16.8 M13.2 13.4 H15.6" />
    <path d="M4.6 17.4 C6.4 16 8.2 17.4 10 16 C8.2 15.6 6.6 14.8 5.2 15.8" />
  `,
  spe_neijing: /*html*/`
    <circle cx="12" cy="12" r="7.4" />
    <path d="M12 4.6 A7.4 7.4 0 0 0 12 19.4" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="12" cy="6.4" r="0.7" fill="currentColor" />
    <circle cx="12" cy="17.6" r="0.7" fill="currentColor" />
    <circle cx="6.4" cy="12" r="0.7" fill="currentColor" />
    <circle cx="17.6" cy="12" r="0.7" fill="currentColor" />
  `,
  spe_jinkui: /*html*/`
    <rect x="3.8" y="5.8" width="16.4" height="13.6" rx="2.2" />
    <rect x="3.8" y="10.2" width="16.4" height="3.2" />
    <circle cx="12" cy="16.6" r="1" fill="currentColor" />
    <path d="M11 16.6 H7.4" />
    <path d="M13 16.6 H16.6" />
    <path d="M7.6 8.6 H16.4" />
  `,

  // 【AI 互动】
  ai_question: /*html*/`
    <path d="M5 7.6 H16.6 A1.6 1.6 0 0 1 18.2 9.2 V14.6 A1.6 1.6 0 0 1 16.6 16.2 H11.8 L8.2 19.6 L8 16.2 H5 A1.6 1.6 0 0 1 3.4 14.6 V9.2 A1.6 1.6 0 0 1 5 7.6 Z" />
    <path d="M10.8 10.6 C10.8 9.8 11.4 9.2 12.2 9.2 C13 9.2 13.6 9.8 13.6 10.6 C13.6 11.2 13 11.6 12.6 12 C12.2 12.4 12.2 12.8 12.2 13.4" />
    <circle cx="12.2" cy="15" r="0.9" fill="currentColor" />
  `,
  ai_ok: /*html*/`
    <path d="M5 7.6 H16.6 A1.6 1.6 0 0 1 18.2 9.2 V14.6 A1.6 1.6 0 0 1 16.6 16.2 H11.8 L8.2 19.6 L8 16.2 H5 A1.6 1.6 0 0 1 3.4 14.6 V9.2 A1.6 1.6 0 0 1 5 7.6 Z" />
    <path d="M8.6 12 L10.8 14.2 L15.8 9.8" />
  `,
  ai_correction: /*html*/`
    <path d="M5 7.6 H16.6 A1.6 1.6 0 0 1 18.2 9.2 V14.6 A1.6 1.6 0 0 1 16.6 16.2 H11.8 L8.2 19.6 L8 16.2 H5 A1.6 1.6 0 0 1 3.4 14.6 V9.2 A1.6 1.6 0 0 1 5 7.6 Z" />
    <path d="M8.6 13.8 L10.2 12.2 M9 12.2 L10.6 13.8" />
    <path d="M13.6 8.2 L17.8 4 L19.6 5.8 L15.4 10" />
    <path d="M16.4 6.8 L18.2 8.6" />
  `,
  ai_sun_moon: /*html*/`
    <path d="M12 4.4 A7.6 7.6 0 0 0 12 19.6 A7.6 7.6 0 0 1 12 4.4 Z" />
    <circle cx="12" cy="12" r="0.9" fill="currentColor" />
    <circle cx="7.6" cy="7.8" r="0.6" fill="currentColor" />
    <circle cx="9.2" cy="4.8" r="0.5" fill="currentColor" />
  `,
  ai_debate: /*html*/`
    <path d="M4.4 7.4 H12 A1.6 1.6 0 0 1 13.6 9 V13.6 A1.6 1.6 0 0 1 12 15.2 H9.2 L6.2 18 L6 15.2 H4.4 A1.6 1.6 0 0 1 2.8 13.6 V9 A1.6 1.6 0 0 1 4.4 7.4 Z" transform="translate(0 0)" />
    <path d="M12 7.4 H19.6 A1.6 1.6 0 0 1 21.2 9 V13.6 A1.6 1.6 0 0 1 19.6 15.2 H16.8 L13.8 18 L13.6 15.2 H12 A1.6 1.6 0 0 1 10.4 13.6 V9 A1.6 1.6 0 0 1 12 7.4 Z" transform="scale(-1 1) translate(-24 0)" />
    <path d="M6.2 10 H10.2 M6.2 12 H8.4" />
    <path d="M13.8 10 H17.8 M15.6 12 H13.8" />
  `,
  ai_microscope: /*html*/`
    <path d="M7.4 19 H16.6" />
    <path d="M10 19 V15 L6.2 11.4" />
    <circle cx="6.2" cy="9.2" r="2.8" />
    <circle cx="6.2" cy="9.2" r="1.2" />
    <path d="M14.2 4.6 L17.8 8.2" />
    <circle cx="13.2" cy="5.6" r="1.4" />
    <path d="M13.6 15.8 C12.6 15 11.8 16.4 11 15.8 C11.8 15.4 13 15.2 13.6 15.8 Z" />
    <circle cx="5" cy="7" r="0.5" fill="currentColor" />
    <circle cx="7.4" cy="7" r="0.5" fill="currentColor" />
    <circle cx="6.2" cy="11" r="0.5" fill="currentColor" />
  `,
  ai_syndrome: /*html*/`
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="6" r="1.6" />
    <circle cx="17.4" cy="10" r="1.6" />
    <circle cx="15.6" cy="17" r="1.6" />
    <circle cx="8.4" cy="17" r="1.6" />
    <circle cx="6.6" cy="10" r="1.6" />
    <path d="M12 7.6 V9 M13.6 11.2 L15.8 9.4 M14.6 13 L15.2 15.6 M9.4 13 L8.8 15.6 M10.4 11.2 L8.2 9.4" />
  `,

  // 备用图（未知 id 用：医书嫩芽）
  fallback_book_sprout: /*html*/`
    <path d="M5 16 H19" />
    <path d="M6.4 7 H14.8 A1.4 1.4 0 0 1 16.2 8.4 V14.6 H5 A1.4 1.4 0 0 1 3.6 13.2 V8.4 A1.4 1.4 0 0 1 5 7 H6.4 Z" />
    <path d="M9 9.8 H13 M9 12.2 H11.6" />
    <path d="M12 10.2 C10.8 9.6 10 7.8 11.4 5.6 C13.2 7.2 13.8 6.4 15.4 5 C14.8 7.4 13.6 9.8 12 10.2 Z" />
  `,
};

/* --------- 3. 成就 ID → 图案类型（主映射表） --------- */
export const ACHIEVEMENT_ICON_MAP = {
  // streak
  streak_001: "streak_sprout",
  streak_003: "streak_three_leaves",
  streak_007: "streak_root",
  streak_030: "streak_grow",
  streak_050: "streak_grow",
  streak_100: "streak_grow",
  streak_180: "streak_lamp_book",
  streak_365: "streak_plum_ring",

  // subject
  sub_first: "sub_first_book",
  sub_5: "sub_balance",
  sub_10: "sub_balance",
  sub_20: "sub_balance",
  sub_hexa_2: "sub_hexa_hexa",
  sub_hexa_4: "sub_hexa_hexa",
  sub_hexa_6: "sub_hexa_hexa",

  // plan
  plan_day: "plan_check",
  plan_week: "plan_week_ring",
  plan_month: "plan_month_moon",
  plan_005: "plan_sundial",
  plan_010: "plan_sundial",
  plan_100: "plan_sundial",
  plan_500: "plan_sundial",
  plan_1000: "plan_sundial",
  plan_wk_master_1: "plan_scroll",
  plan_wk_master_2: "plan_scroll",
  plan_wk_master_3: "plan_scroll",
  plan_wk_master_4: "plan_scroll",
  plan_wk_master_5: "plan_scroll",
  plan_mo_master_1: "plan_scroll",
  plan_mo_master_2: "plan_scroll",
  plan_mo_master_3: "plan_scroll",
  plan_mo_master_4: "plan_scroll",
  plan_mo_master_5: "plan_scroll",

  // knowledge 评论 / 关联 / 掌握
  kb_cmt_001: "kb_comment",
  kb_cmt_050: "kb_comment",
  kb_cmt_200: "kb_comment",
  kb_cmt_300: "kb_comment",
  kb_cmt_500: "kb_comment",
  kb_like_020: "kb_comment_sparkle",
  kb_like_050: "kb_comment_sparkle",
  kb_like_100: "kb_comment_sparkle",
  kb_link_010: "kb_link",
  kb_link_100: "kb_link",
  kb_link_500: "kb_link",
  kb_kp_clear: "kb_master",
  kb_huaqian_1: "kb_master",
  kb_huaqian_2: "kb_master",
  kb_huaqian_3: "kb_master",
  kb_xuefu_1: "kb_master",
  kb_xuefu_2: "kb_master",
  kb_xuefu_3: "kb_master",

  // specialty
  spe_mat_1: "spe_shennong",
  spe_mat_2: "spe_shennong",
  spe_mat_3: "spe_shennong",
  spe_mat_4: "spe_shennong",
  spe_shh_1: "spe_shanghan",
  spe_shh_2: "spe_shanghan",
  spe_shh_3: "spe_shanghan",
  spe_shh_4: "spe_shanghan",
  spe_nei_1: "spe_neijing",
  spe_nei_2: "spe_neijing",
  spe_nei_3: "spe_neijing",
  spe_nei_4: "spe_neijing",
  spe_jin_1: "spe_jinkui",
  spe_jin_2: "spe_jinkui",
  spe_jin_3: "spe_jinkui",
  spe_jin_4: "spe_jinkui",
  spe_zhong_fu_1: "sub_first_book",
  spe_zhong_fu_2: "sub_first_book",
  spe_zhong_fu_3: "sub_first_book",
  spe_zhong_fu_4: "sub_first_book",
  spe_zhong_er_1: "sub_first_book",
  spe_zhong_er_2: "sub_first_book",
  spe_zhong_er_3: "sub_first_book",
  spe_zhong_er_4: "sub_first_book",

  // ai
  ai_q_010: "ai_question",
  ai_q_100: "ai_question",
  ai_q_500: "ai_question",
  ai_q_1000: "ai_question",
  ai_q_1500: "ai_question",
  ai_fb_ok_010: "ai_ok",
  ai_fb_ok_050: "ai_ok",
  ai_fb_ok_100: "ai_ok",
  ai_fb_bad_010: "ai_correction",
  ai_fb_bad_050: "ai_correction",
  ai_fb_bad_100: "ai_correction",
  ai_combo_1: "ai_sun_moon",
  ai_combo_2: "ai_sun_moon",
  ai_combo_3: "ai_sun_moon",
  ai_act_sibian_10: "ai_debate",
  ai_act_sibian_20: "ai_debate",
  ai_act_sibian_30: "ai_debate",
  ai_act_sibian_40: "ai_debate",
  ai_act_wenhu_10: "ai_microscope",
  ai_act_wenhu_20: "ai_microscope",
  ai_act_wenhu_30: "ai_microscope",
  ai_act_wenhu_40: "ai_microscope",
  ai_act_bz_10: "ai_syndrome",
  ai_act_bz_20: "ai_syndrome",
  ai_act_bz_30: "ai_syndrome",
  ai_act_bz_40: "ai_syndrome",
};

/* --------- 4. 分类 KEY → 分类图标 KEY --------- */
// 这里跟 CATEGORY_ICON_SVGS 的 key 一致即可。
export const CATEGORY_TO_ICON_KEY = {
  all: "all",
  streak: "streak",
  subject: "subject",
  plan: "plan",
  knowledge: "knowledge",
  specialty: "specialty",
  ai: "ai",
};
