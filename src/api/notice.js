import { mockResponse } from "./index";

const STORAGE_KEY = "xy-api-notices";
const COMMENTS_KEY = "xy-api-notice-comments";

const defaultNotices = [
  {
    id: "n001",
    title: "系统更新通知",
    date: "2026-08-15",
    body: "我们更新了知识图谱的交互体验，优化了弱关联的展示，新增拖拽缩放功能，快去试试吧！",
    ignored: false,
    read: false,
    category: "system",
  },
  {
    id: "n002",
    title: "学习成就解锁提醒",
    date: "2026-08-12",
    body: "恭喜你已连续学习12天！距离「博览群书」成就还需3小时学习时长，继续加油！",
    ignored: false,
    read: true,
    category: "achievement",
  },
  {
    id: "n003",
    title: "本周学习报告已生成",
    date: "2026-08-11",
    body: "本周总学习时长14.2小时，日均2小时，方剂学进步最快。点击查看完整报告。",
    ignored: false,
    read: false,
    category: "report",
  },
];

function readNotices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return defaultNotices.map((n) => ({ ...n }));
}

function writeNotices(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
}

function readComments(noticeId) {
  try {
    const raw = localStorage.getItem(`${COMMENTS_KEY}-${noticeId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const seed = {
    n001: [
      { id: "c1", author: "杏林小学徒", content: "知识图谱更新太好用了，点赞！", date: "2026-08-15 14:30", likes: 12 },
      { id: "c2", author: "岐黄之路", content: "希望下次能加个节点收藏功能～", date: "2026-08-15 16:22", likes: 5 },
    ],
  };
  return seed[noticeId] || [];
}

function writeComments(noticeId, list) {
  try {
    localStorage.setItem(`${COMMENTS_KEY}-${noticeId}`, JSON.stringify(list));
  } catch (e) {}
}

export function getNotices() {
  return mockResponse(() => {
    const list = readNotices();
    return { list, unreadCount: list.filter((n) => !n.read && !n.ignored).length };
  }, 300);
}

export function getNoticeDetail(id) {
  return mockResponse(() => {
    const list = readNotices();
    const notice = list.find((n) => n.id === id);
    if (notice) {
      notice.read = true;
      writeNotices(list);
    }
    return notice || null;
  }, 250);
}

export function ignoreNotice(id) {
  return mockResponse(() => {
    const list = readNotices();
    const notice = list.find((n) => n.id === id);
    if (notice) notice.ignored = true;
    writeNotices(list);
    return { ok: true, id };
  }, 200);
}

export function getNoticeComments(noticeId) {
  return mockResponse(() => readComments(noticeId), 250);
}

export function addNoticeComment(noticeId, content, author = "岐黄学子") {
  return mockResponse(() => {
    const list = readComments(noticeId);
    const newComment = {
      id: "c-" + Date.now(),
      author,
      content,
      date: new Date().toLocaleString("zh-CN"),
      likes: 0,
    };
    list.unshift(newComment);
    writeComments(noticeId, list);
    return newComment;
  }, 350);
}
