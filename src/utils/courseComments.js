import { ref } from 'vue';

const STORAGE_KEY = 'xueyi-course-comments-v1';

function readComments() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export const courseComments = ref(readComments());

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courseComments.value));
  } catch {
    // Storage may be unavailable; keep changes for the current app session.
  }
}

function makeKey(courseId, nodeId) {
  return `${String(courseId)}:${String(nodeId)}`;
}

export function getCourseComments(courseId, nodeId) {
  const key = makeKey(courseId, nodeId);
  const list = courseComments.value[key];
  return Array.isArray(list) ? list : [];
}

export function addCourseComment(courseId, nodeId, text, replyTo = null) {
  const key = makeKey(courseId, nodeId);
  const list = [...getCourseComments(courseId, nodeId)];
  const comment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '岐黄学子',
    text: String(text || '').trim(),
    createdAt: new Date().toISOString(),
    likes: 0,
    liked: false,
    starred: false,
    reported: false,
    replyTo: replyTo ? { id: replyTo.id, name: replyTo.name } : null,
  };
  if (!comment.text) return null;
  list.unshift(comment);
  courseComments.value = { ...courseComments.value, [key]: list };
  persist();
  return comment;
}

export function updateCourseComment(courseId, nodeId, commentId, patch) {
  const key = makeKey(courseId, nodeId);
  const list = getCourseComments(courseId, nodeId).map((item) =>
    item.id === commentId ? { ...item, ...patch } : item,
  );
  courseComments.value = { ...courseComments.value, [key]: list };
  persist();
}
