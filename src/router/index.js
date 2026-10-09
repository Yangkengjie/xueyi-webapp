import { createRouter, createWebHistory } from "vue-router";
import TabLayout from "../layouts/TabLayout.vue";

const routes = [
  {
    path: "/",
    component: TabLayout,
    children: [
      {
        path: "",
        name: "home",
        component: () => import("../views/HomeView.vue"),
        meta: { title: "首页" },
      },
      {
        path: "study",
        name: "study",
        component: () => import("../views/StudyView.vue"),
        meta: { title: "学习" },
      },
      {
        path: "tutor",
        name: "tutor",
        component: () => import("../views/TutorView.vue"),
        meta: { title: "推演" },
      },
      {
        path: "mine",
        name: "mine",
        component: () => import("../views/MineView.vue"),
        meta: { title: "我的" },
      },
    ],
  },

  /* ---- 登录（无框架） ---- */
  {
    path: "/login",
    name: "login",
    component: () => import("../views/LoginView.vue"),
    meta: { title: "登录" },
  },

  /* ---- 推演 ---- */
  {
    path: "/answer/:id",
    name: "answer",
    component: () => import("../views/AnswerView.vue"),
    meta: { title: "AI 答疑" },
  },
  {
    path: "/history",
    name: "history",
    component: () => import("../views/HistoryView.vue"),
    meta: { title: "历史" },
  },

  /* ---- 学习 ---- */
  {
    path: "/course-framework",
    name: "courseFramework",
    component: () => import("../views/CourseFrameworkView.vue"),
    meta: { title: "课程框架" },
  },
  {
    path: "/learning-resources",
    name: "learningResources",
    component: () => import("../views/LearningResourcesView.vue"),
    meta: { title: "学习资源" },
  },
  {
    path: "/learning-resource/:module",
    name: "resourceDetail",
    component: () => import("../views/ResourceDetailView.vue"),
    meta: { title: "学习资源详情" },
  },
  {
    path: "/course/:id",
    name: "course",
    component: () => import("../views/CourseView.vue"),
    meta: { title: "课程大纲" },
  },
  {
    path: "/course/:courseId/content/:nodeId",
    name: "courseContent",
    component: () => import("../views/CourseContentView.vue"),
    meta: { title: "课程内容" },
  },
  {
    path: "/topic",
    name: "topic",
    component: () => import("../views/TopicView.vue"),
    meta: { title: "中医基础理论" },
  },
  {
    path: "/graph",
    name: "graph",
    component: () => import("../views/GraphView.vue"),
    meta: { title: "知识图谱模式" },
  },
  {
    path: "/quick-search",
    name: "quickSearch",
    component: () => import("../views/QuickSearchView.vue"),
    meta: { title: "知识速查" },
  },
  {
    path: "/comments",
    name: "comments",
    component: () => import("../views/CommentsView.vue"),
    meta: { title: "评论区" },
  },

  /* ---- 我的 ---- */
  {
    path: "/profile",
    name: "profile",
    component: () => import("../views/ProfileView.vue"),
    meta: { title: "个人资料" },
  },
  {
    path: "/persona",
    name: "persona",
    component: () => import("../views/PersonaView.vue"),
    meta: { title: "学习者画像" },
  },
  {
    path: "/journey",
    name: "journey",
    component: () => import("../views/JourneyView.vue"),
    meta: { title: "学习历程" },
  },
  {
    path: "/achievements",
    name: "achievements",
    component: () => import("../views/AchievementsView.vue"),
    meta: { title: "我的成就" },
  },
  {
    path: "/weekly-report",
    name: "weeklyReport",
    component: () => import("../views/WeeklyReportView.vue"),
    meta: { title: "周报" },
  },
  {
    path: "/monthly-report",
    name: "monthlyReport",
    component: () => import("../views/MonthlyReportView.vue"),
    meta: { title: "月报" },
  },
  {
    path: "/favorites",
    name: "favorites",
    component: () => import("../views/FavoritesView.vue"),
    meta: { title: "我的收藏" },
  },
  {
    path: "/settings",
    name: "settings",
    component: () => import("../views/SettingsView.vue"),
    meta: { title: "设置" },
  },
  {
    path: "/support",
    name: "support",
    component: () => import("../views/SupportView.vue"),
    meta: { title: "咨询与反馈" },
  },
  {
    path: "/about",
    name: "about",
    component: () => import("../views/AboutView.vue"),
    meta: { title: "了解我们" },
  },

  {
    path: "/:pathMatch(.*)*",
    redirect: { name: "home" },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (to, from, savedPosition) => savedPosition || { top: 0 },
});

router.afterEach((to) => {
  if (to.meta?.title) document.title = `${to.meta.title} · 学医智用`;
});

export default router;
