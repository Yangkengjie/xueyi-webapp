<template>
  <PlainLayout title="了解我们">
    <div class="about">
      <div class="about__pill">中医学习与备考助手</div>

      <div class="about__logo">
        <span class="about__logo-char">学</span>
        <span class="about__logo-char">医</span>
        <span class="about__logo-char">智</span>
        <span class="about__logo-char">用</span>
      </div>

      <p class="about__slogan">AI 驱动的中医学习助手<br />经典 · 临床 · 考试全方位</p>
      <p class="about__sub">让岐黄之术，触手可及</p>

      <p class="about__note">以下数据为演示数据，仅供原型展示使用。</p>
      <div class="about__stats">
        <div v-for="s in stats" :key="s.label" class="about__stat">
          <p class="about__stat-num">{{ s.num }}</p>
          <p class="about__stat-label">{{ s.label }}<span class="demo-tag">演示</span></p>
        </div>
      </div>

      <div class="about__section">
        <p class="about__sec-title">产品特点</p>
        <ul class="about__features">
          <li>🔸 学习者画像：AI 评估学习风格，个性化推荐</li>
          <li>🔸 知识图谱：从经典到临床，知识脉络一目了然</li>
          <li>🔸 多模式讲解：古籍、医案、临床、研究任意切换</li>
          <li>🔸 学习历程：日报 / 周报 / 月报，记录每一步成长</li>
        </ul>
      </div>

      <!-- 新功能前瞻 -->
      <div class="about__section">
        <p class="about__sec-title">✨ 新功能前瞻</p>
        <ul v-if="roadmap.length" class="roadmap">
          <li v-for="v in roadmap" :key="v.version" class="roadmap__item">
            <header class="roadmap__head">
              <span class="roadmap__ver">{{ v.version }}</span>
              <span class="roadmap__status">{{ v.status }}</span>
            </header>
            <ul class="roadmap__list">
              <li v-for="(it, idx) in v.items" :key="idx">{{ it }}</li>
            </ul>
          </li>
        </ul>
      </div>

      <!-- 团队成员 -->
      <div class="about__section">
        <p class="about__sec-title">🧑‍🤝‍🧑 团队成员</p>
        <ul v-if="team.length" class="team">
          <li v-for="m in team" :key="m.nickname" class="team__item">
            <div class="team__avatar">{{ avatarChar(m.nickname) }}</div>
            <div class="team__body">
              <div class="team__top">
                <h4 class="team__name">{{ m.nickname }}</h4>
                <span class="team__role">{{ m.role }}</span>
              </div>
              <p class="team__resp">负责内容：{{ m.responsible }}</p>
              <p class="team__profile">个人简介：{{ m.profile }}</p>
            </div>
          </li>
        </ul>
      </div>

      <!-- 致谢 -->
      <div class="about__section">
        <p class="about__sec-title">💐 致谢名单</p>
        <ul v-if="acknowledgements.length" class="ack-list">
          <li v-for="a in acknowledgements" :key="a.name" class="ack-list__item">
            <span class="ack-list__name">{{ a.name }}</span>
            <span class="ack-list__note">{{ a.note }}</span>
          </li>
        </ul>
      </div>

      <!-- 加入我们 -->
      <div class="about__section">
        <p class="about__sec-title">🚀 加入我们</p>
        <ul v-if="joinUs.positions && joinUs.positions.length" class="join-list">
          <li v-for="p in joinUs.positions" :key="p.title" class="join-list__item">
            <h4 class="join-list__title">{{ p.title }}</h4>
            <p class="join-list__req">要求：{{ p.requirement }}</p>
            <p class="join-list__contact">联系方式：{{ p.contact }}</p>
          </li>
        </ul>
        <p class="join-list__how">👉 {{ joinUs.howTo }}</p>
        <p class="about__disclaimer">{{ joinUs.disclaimer }}</p>
      </div>

      <div class="about__section about__contact">
        <p class="about__sec-title">联系我们</p>
        <ul class="contact-list">
          <li>
            <span class="contact-list__tag">📧 邮箱</span>
            <span>xueyi-support@example.com</span>
          </li>
          <li>
            <span class="contact-list__tag">📱 电话</span>
            <span>400-0000-000（演示）</span>
          </li>
          <li>
            <span class="contact-list__tag">🗺 地址</span>
            <span>四川省成都市 · 中医药大学科技园区（演示）</span>
          </li>
          <li>
            <span class="contact-list__tag">💬 反馈</span>
            <button class="contact-list__link" @click="$router.push({ name: 'support' })">前往咨询与反馈页面 ›</button>
          </li>
        </ul>
        <p class="about__disclaimer">
          以上联系方式为演示用途，不构成真实服务承诺。如需真实反馈请前往「咨询与反馈」页面提交。
        </p>
      </div>
    </div>
  </PlainLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import PlainLayout from "../layouts/PlainLayout.vue";
import * as aboutApi from "../api/about.js";

const stats = [
  { num: "200K+", label: "用户规模" },
  { num: "500+", label: "终端适配" },
  { num: "3K+", label: "开源贡献" },
  { num: "6K+", label: "社区规模" },
];

const roadmap = ref([]);
const team = ref([]);
const acknowledgements = ref([]);
const joinUs = ref({ positions: [], howTo: "", disclaimer: "" });

function avatarChar(name) {
  const n = String(name || "");
  return n ? n[n.length - 1] : "学";
}

onMounted(async () => {
  try {
    const r = await aboutApi.getAboutAll();
    if (r?.code === 200) {
      roadmap.value = r.data.roadmap || [];
      team.value = r.data.team || [];
      acknowledgements.value = r.data.acknowledgements || [];
      joinUs.value = r.data.joinUs || { positions: [], howTo: "", disclaimer: "" };
    }
  } catch (_) {}
});
</script>

<style scoped>
.about {
  text-align: center;
  padding-top: 10px;
  padding-bottom: 40px;
}
.about__pill {
  display: inline-block;
  background: linear-gradient(90deg, #4b6cb7, #3e5f9e);
  color: #fff;
  font-size: 13px;
  border-radius: var(--radius-pill);
  padding: 9px 22px;
}
.about__logo {
  margin: 26px 0 18px;
  display: flex;
  justify-content: center;
  gap: 8px;
}
.about__logo-char {
  font-size: 44px;
  font-weight: 700;
  color: var(--color-primary);
}
.about__logo-char:nth-child(2),
.about__logo-char:nth-child(4) {
  transform: translateY(26px);
}
.about__slogan {
  margin-top: 44px;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.7;
}
.about__sub {
  margin-top: 10px;
  color: var(--color-text-caption);
  font-size: 13px;
}
.about__note {
  margin-top: 18px;
  padding: 0 32px;
  font-size: 12px;
  color: var(--color-text-caption);
}
.about__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
  padding: 18px 60px 10px;
}
.about__stat-num {
  font-size: 26px;
  font-weight: 300;
  color: var(--color-primary);
}
.about__stat-label {
  font-size: 12px;
  color: var(--color-text-caption);
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.demo-tag {
  font-size: 10px;
  padding: 1px 6px;
  border: 1px solid var(--color-divider);
  color: var(--color-text-caption);
  border-radius: 4px;
  margin-left: 4px;
}
.about__section {
  margin: 24px var(--page-padding) 0;
  padding: 16px 14px;
  background: var(--color-input-bg);
  border-radius: var(--radius-card);
  text-align: left;
}
.about__sec-title {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 10px;
}
.about__features {
  list-style: none;
  padding: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 2;
}

/* Roadmap */
.roadmap {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.roadmap__item {
  border: 1px solid var(--color-divider);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--color-card);
}
.roadmap__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.roadmap__ver { font-weight: 600; font-size: 13px; color: var(--color-primary); }
.roadmap__status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-input-bg);
  color: var(--color-text-secondary);
}
.roadmap__list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 12.5px;
  line-height: 1.9;
  color: var(--color-text-secondary);
}
.roadmap__list li::before {
  content: "·";
  display: inline-block;
  width: 12px;
  color: var(--color-primary);
  font-weight: 700;
}

/* Team */
.team {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
.team__item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px;
  border-radius: 10px;
  background: var(--color-card);
  border: 1px solid var(--color-divider);
}
.team__avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  background: linear-gradient(135deg, #43a047, #1f5c38);
}
.team__body { flex: 1; min-width: 0; }
.team__top {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.team__name { margin: 0; font-size: 14px; font-weight: 600; }
.team__role {
  font-size: 11px;
  color: #2e7d32;
  background: #e8f5e9;
  padding: 1px 8px;
  border-radius: 999px;
}
.team__resp,
.team__profile {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

/* Ack */
.ack-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ack-list__item {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 10px;
  font-size: 12.5px;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--color-card);
}
.ack-list__name { font-weight: 500; color: var(--color-text); }
.ack-list__note { color: var(--color-text-secondary); }
@media (max-width: 420px) {
  .ack-list__item { grid-template-columns: 1fr; }
}

/* Join us */
.join-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.join-list__item {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--color-card);
  border: 1px solid var(--color-divider);
}
.join-list__title {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
}
.join-list__req,
.join-list__contact {
  margin: 3px 0 0;
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}
.join-list__how {
  margin: 10px 0 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.6;
}

/* Contact */
.contact-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.contact-list li {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: center;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.contact-list__tag {
  font-size: 12px;
  color: var(--color-primary);
}
.contact-list__link {
  font-size: 13px;
  color: var(--color-primary);
  text-align: left;
  font-weight: 500;
}
.about__disclaimer {
  margin-top: 12px;
  font-size: 11px;
  color: var(--color-text-caption);
  line-height: 1.6;
}
</style>
