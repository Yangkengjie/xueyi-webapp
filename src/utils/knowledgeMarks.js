import { ref } from 'vue';

const STORAGE_KEY = 'xueyi-knowledge-marks-v1';
const LABELS = {
  mastered: '掌握',
  familiar: '熟悉',
  understood: '了解',
  weak: '薄弱',
};

function readStoredMarks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export const knowledgeMarks = ref(readStoredMarks());
export const knowledgeMarkOptions = Object.entries(LABELS).map(([value, label]) => ({ value, label }));

export function getKnowledgeMark(courseId, nodeId) {
  return knowledgeMarks.value[`${courseId}:${nodeId}`] || '';
}

export function setKnowledgeMark(courseId, nodeId, value) {
  const key = `${courseId}:${nodeId}`;
  const next = { ...knowledgeMarks.value };
  if (value && LABELS[value]) next[key] = value;
  else delete next[key];
  knowledgeMarks.value = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // If storage is unavailable, the mark still remains in this app session.
  }
}

export function getKnowledgeMarkLabel(value) {
  return LABELS[value] || '';
}
