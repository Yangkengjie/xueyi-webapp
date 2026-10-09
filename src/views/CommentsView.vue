<template>
  <PlainLayout title="中医基础理论：脾">
    <div class="comments">
      <div v-for="c in list" :key="c.id" class="comment">
        <span class="comment__avatar">{{ c.name[0] }}</span>
        <div class="comment__main">
          <p class="comment__name">{{ c.name }}</p>
          <p class="comment__text">{{ c.text }}</p>
          <div class="comment__actions">
            <button class="comment__act" :class="{ 'comment__act--on': c.liked }" @click="like(c)">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                   stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3zm0 0 4.5-7a2.4 2.4 0 0 1 2.3 3l-.7 3h5.4a2 2 0 0 1 2 2.4l-1.4 7a2 2 0 0 1-2 1.6H7" />
              </svg>
              <span v-if="c.likes">{{ c.likes }}</span>
            </button>
            <button class="comment__act" :class="{ 'comment__act--on': c.starred }" @click="star(c)">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                   stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="m12 3 2.7 5.6 6.3.9-4.5 4.3 1 6.2-5.5-3-5.5 3 1-6.2L3 9.5l6.3-.9L12 3z" />
              </svg>
            </button>
            <button class="comment__act" @click="toast('已反馈')">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                   stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 14V3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-3zm0 0-4.5 7a2.4 2.4 0 0 1-2.3-3l.7-3H5.5a2 2 0 0 1-2-2.4l1.4-7A2 2 0 0 1 6.9 3H17" />
              </svg>
            </button>
            <button class="comment__act" @click="replyTo = c; inputFocus++">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                   stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" />
              </svg>
            </button>
          </div>
          <div v-if="c.replies" class="comment__reply">
            <p class="comment__reply-text">{{ c.replies.author }}：{{ c.replies.text }}</p>
            <p class="comment__reply-more" @click="toast('回复列表建设中')">共{{ c.replies.total }}条回复 ›</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部评论栏 -->
    <div class="comments__bar">
      <button class="comments__icon" aria-label="搜索评论" @click="toast('评论搜索建设中')">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round">
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" />
        </svg>
      </button>
      <div class="comments__input-wrap">
        <input
          v-model="draft"
          class="comments__input"
          :placeholder="replyTo ? `回复 ${replyTo.name}……` : '写下你的评论……'"
          @keyup.enter="send"
        />
      </div>
      <button class="comments__icon" aria-label="语音输入" @click="toast('语音输入建设中')">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      </button>
      <button class="comments__icon" aria-label="发送" @click="send">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round">
          <circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" />
        </svg>
      </button>
    </div>
  </PlainLayout>
</template>

<script setup>
import { ref } from "vue";
import PlainLayout from "../layouts/PlainLayout.vue";
import { comments } from "../mock/data";
import { toast } from "../utils/feedback";
import * as eventApi from "../api/events";
import { useAchievements } from "../composables/useAchievements";

const ach = useAchievements();
const list = ref(comments.map((c) => ({ ...c, liked: false, starred: false })));
const draft = ref("");
const replyTo = ref(null);
const inputFocus = ref(0);

const like = async (c) => {
  const wasLiked = !!c.liked;
  c.liked = !c.liked;
  c.likes = Math.max(0, (Number(c.likes) || 0) + (wasLiked ? -1 : 1));
  /* --- 点赞达到 10 的事件 --- */
  try {
    const reached10 = Number(c.likes) >= 10;
    if (typeof eventApi.recordEvent === "function") {
      await eventApi.recordEvent("comment_like_update", {
        commentId: c.id,
        likes: Number(c.likes) || 0,
        reached10,
      });
    }
    if (reached10) {
      await ach.trigger("comment:like10", { relatedMetrics: ["commentsLiked10"] });
    }
  } catch (_) {}
};

const star = (c) => {
  c.starred = !c.starred;
  toast(c.starred ? "已收藏\n可在“我的-我的收藏”中查看" : "已取消收藏");
};

const send = async () => {
  const text = draft.value.trim();
  if (!text) return;
  const newC = {
    id: Date.now(),
    name: "岐黄学子",
    text: replyTo.value ? `回复 ${replyTo.value.name}：${text}` : text,
    likes: 0,
    replies: null,
    liked: false,
    starred: false,
  };
  list.value.unshift(newC);
  draft.value = "";
  replyTo.value = null;
  toast("已发布");
  /* --- 真实事件：comment_publish --- */
  try {
    if (typeof eventApi.recordEvent === "function") {
      await eventApi.recordEvent("comment_publish", {
        commentId: newC.id,
        topicId: "comments-main",
        likes: 0,
      });
    }
    await ach.trigger("comment:publish", { relatedMetrics: ["commentsTotal"] });
  } catch (_) {}
};
</script>

<style scoped>
.comments {
  padding-bottom: 80px;
}
.comment {
  display: flex;
  gap: 10px;
  padding: 14px var(--page-padding);
}
.comment__avatar {
  flex: 0 0 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-primary-tint);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}
.comment__main {
  flex: 1;
  min-width: 0;
}
.comment__name {
  font-weight: 600;
  font-size: 13px;
}
.comment__text {
  font-size: 14px;
  line-height: 1.7;
  margin-top: 4px;
  text-align: justify;
}
.comment__actions {
  display: flex;
  gap: 18px;
  margin-top: 8px;
  justify-content: flex-end;
}
.comment__act {
  display: flex;
  align-items: center;
  gap: 3px;
  color: var(--color-text-caption);
  font-size: 12px;
}
.comment__act--on {
  color: var(--color-primary);
}
.comment__reply {
  background: var(--color-input-bg);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  margin-top: 8px;
}
.comment__reply-text {
  font-size: 13px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.comment__reply-more {
  font-size: 12px;
  color: var(--color-text-caption);
  margin-top: 4px;
  cursor: pointer;
}

.comments__bar {
  position: fixed;
  bottom: var(--safe-bottom);
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--page-width);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px var(--page-padding);
  background: var(--color-bg);
  z-index: 100;
}
.comments__input-wrap {
  flex: 1;
  background: var(--color-card);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-card);
  padding: 9px 14px;
}
.comments__input {
  width: 100%;
  font-size: 14px;
}
.comments__icon {
  display: flex;
  padding: 4px;
  color: var(--color-text-secondary);
}
</style>
