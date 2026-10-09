/* ============================================================
 * journey.js — 学习历程总览 Mock API
 * 返回：
 *  - perCourse：每个科目 学习%/复习%/掌握%
 *  - tcm/western/all：三科总体进度
 *  - overview：天数/科目占比%/关联/评论/复习数
 * 所有数据从 events.js 真源 + courses 静态 + report 现有 records 聚合，页面禁止写死。
 * ============================================================ */
import { mockResponse } from "./index.js";
import { courses } from "../mock/data.js";
import { aggregateMetrics } from "./events.js";
import * as reportApi from "./report.js";

function safePct(n, d) {
  const num = Number(n) || 0, den = Number(d) || 0;
  if (den <= 0) return Math.max(0, Math.min(100, num));
  return Math.max(0, Math.min(100, Math.round((num / den) * 100)));
}

/* 读 report 现有的 records 做"分钟数兜底"聚合（和 events 叠加，不冲突） */
function readReportMinutes() {
  try {
    const records = (reportApi._internal && typeof reportApi._internal.getRecords === "function")
      ? reportApi._internal.getRecords() || {}
      : {};
    const perCourseName = {};
    const perCategory = {};
    let totalMin = 0;
    const totalCourses = courses.length;
    let activeStudyDays = 0;
    for (const date of Object.keys(records)) {
      const r = records[date] || {};
      const m = Number(r.minutes) || 0;
      totalMin += m;
      if (m >= 15) activeStudyDays++;
      const rCourses = r.courses || {};
      for (const id of Object.keys(rCourses)) {
        const entry = rCourses[id] || {};
        const c = courses.find((x) => x.courseId === id) || courses.find((x) => x.name === entry.courseName);
        const name = entry.courseName || (c ? c.name : id);
        const cat = c ? c.category : "tcm";
        const min = Number(entry.minutes) || 0;
        perCourseName[name] = (perCourseName[name] || 0) + min;
        perCategory[cat] = (perCategory[cat] || 0) + min;
      }
    }
    return { perCourseName, perCategory, totalMin, totalCourses, activeStudyDays };
  } catch (e) {
    return { perCourseName: {}, perCategory: {}, totalMin: 0, totalCourses: courses.length, activeStudyDays: 0 };
  }
}

export function getJourneyOverview() {
  return mockResponse(async () => {
    const m = aggregateMetrics();
    const r = readReportMinutes();

    /* 单科：从 courses.progress 当 master 百分比；learn/review 按 2:1 分钟拆分近似 */
    const perCourse = courses.map((c) => {
      const min = (r.perCourseName[c.name] || 0) + ((m.dailyMinutesByCategoryKey || {})[c.categoryKey] || 0) / 60;
      const learnPct  = c.progress ? safePct(Math.round(c.progress * 0.65), 100) : 0;
      const reviewPct = c.progress ? safePct(Math.round(c.progress * 0.30), 100) : 0;
      const masterPct = Number(c.progress) || 0;
      return {
        id: c.courseId || c.name,
        name: c.name,
        category: c.category,
        categoryKey: c.categoryKey,
        started: !!c.started,
        completed: !!c.completed,
        progress: masterPct,
        learn: learnPct,
        review: reviewPct,
        master: masterPct,
        minutes: min,
      };
    });

    /* 中医 / 西医 / 全部分类总体 */
    function bucket(catList) {
      if (!catList.length) return { learn: 0, review: 0, master: 0 };
      const L = catList.reduce((s, x) => s + x.learn, 0) / catList.length;
      const R = catList.reduce((s, x) => s + x.review, 0) / catList.length;
      const M = catList.reduce((s, x) => s + x.master, 0) / catList.length;
      return { learn: Math.round(L), review: Math.round(R), master: Math.round(M) };
    }
    const tcmList     = perCourse.filter((c) => c.category === "tcm");
    const westernList = perCourse.filter((c) => c.category === "western");
    const tcm      = bucket(tcmList);
    const western  = bucket(westernList);
    const overall  = bucket(perCourse);

    const professionalTotal = courses.length;
    const studiedSubjects = perCourse.filter((c) => c.started).length;

    const overview = {
      activeStudyDays: Math.max(m.activeStudyDays || 0, r.activeStudyDays || 0),
      studiedSubjects,
      professionalTotal,
      subjectsPercent: safePct(studiedSubjects, professionalTotal),
      knowledgeLinks: m.knowledgeLinks || 0,
      commentsTotal: m.commentsTotal || 0,
      reviewCount: (m.masteredKps || 0) + Math.floor((r.totalMin || 0) / 30),
      totalMinutes: m.totalMinutesAll || r.totalMin || 0,
    };

    return {
      perCourse,
      tcm,
      western,
      overall,
      /* 和 perCourse 顶层保持一致字段名，便于 view 直接渲染 */
      category: {
        tcm, western, overall,
      },
    };
  }, 300);
}
