<template>
  <PlainLayout title="个人资料">
    <div class="profile__avatar-wrap">
      <div class="profile__avatar" @click="chooseAvatar">
        <img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="avatar" class="profile__avatar-img" />
        <svg v-else viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#9db8a6"
             stroke-width="1.6" stroke-linecap="round">
          <circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c1.5-3.6 4-5 7-5s5.5 1.4 7 5" />
        </svg>
      </div>
      <button class="profile__avatar-btn" @click="chooseAvatar">更换头像</button>
    </div>

    <div v-for="row in rows" :key="row.key" class="profile__group">
      <p class="profile__label">{{ row.label }}</p>
      <div class="profile__field" @click="row.editable && edit(row)">
        <span>{{ row.value }}</span>
        <svg v-if="row.editable" viewBox="0 0 24 24" width="14" height="14" fill="none"
             stroke="#bbb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="toast-fade">
        <div v-if="editing" class="edit-mask" @click.self="editing = null">
          <div class="edit-box">
            <p class="edit-box__label">修改{{ editing.label }}</p>
            <input v-model="editValue" class="edit-box__input" @keyup.enter="save" />
            <div class="edit-box__btns">
              <button class="edit-box__btn" @click="editing = null">取消</button>
              <button class="edit-box__btn edit-box__btn--ok" @click="save">保存</button>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="toast-fade">
        <div v-if="showAvatarPicker" class="edit-mask" @click.self="showAvatarPicker = false">
          <div class="edit-box">
            <p class="edit-box__label">选择头像</p>
            <div class="avatar-grid">
              <div
                class="avatar-opt avatar-opt--upload"
                :class="{ 'avatar-opt--on': selectedAvatar && selectedAvatar === customAvatar }"
                @click="triggerFilePick"
              >
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none"
                     stroke="currentColor" stroke-width="1.8"
                     stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span class="avatar-opt__text">从相册选择</span>
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  class="avatar-opt__file"
                  aria-label="选择本地图片作为头像"
                  @change="onFileChange"
                />
              </div>
              <div
                v-for="(a, i) in avatarOptions"
                :key="'preset-' + i"
                class="avatar-opt"
                :class="{ 'avatar-opt--on': selectedAvatar === a }"
                @click="selectedAvatar = a"
              >
                <img v-if="a.startsWith('http') || a.startsWith('data:')" :src="a" alt="头像" />
                <span v-else class="avatar-opt__text">{{ a }}</span>
              </div>
            </div>
            <div class="edit-box__btns">
              <button class="edit-box__btn" @click="showAvatarPicker = false">取消</button>
              <button class="edit-box__btn edit-box__btn--ok" @click="saveAvatar">保存</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </PlainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import PlainLayout from "../layouts/PlainLayout.vue";
import { useStore, safeLSGet, safeLSSet } from "../composables/useStore";
import * as userApi from "../api/user";
import { toast, showLoading, hideLoading } from "../utils/feedback";
const router = useRouter();
const { state: storeState, loadUser, updateUser, updateAvatar } = useStore();

const user = computed(() => storeState.user);

const PROFILE_KEY = "xy-profile-rows";

const defaultRows = [
  { key: "nickname", label: "昵称", value: "岐黄学子", editable: true, field: "userName" },
  { key: "id", label: "ID", value: "2024001", editable: false, field: "userId" },
  { key: "persona", label: "个人画像", value: "体系构建师", editable: true, field: "persona" },
  { key: "school", label: "学校", value: "成都中医药大学", editable: true, field: "school" },
  { key: "major", label: "专业", value: "中医学5年制", editable: true, field: "major" },
  { key: "grade", label: "年级", value: "大一", editable: true, field: "grade" },
  { key: "gender", label: "性别", value: "女", editable: true, field: "gender" },
  { key: "phone", label: "手机号", value: "18682000000", editable: true, field: "phone" },
];

const rows = ref([]);

const avatarOptions = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=TCM1",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=TCM2",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=TCM3",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=TCM4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=TCM5",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=TCM6",
];

const editing = ref(null);
const editValue = ref("");
const showAvatarPicker = ref(false);
const selectedAvatar = ref("");
const customAvatar = ref("");
const fileInputRef = ref(null);

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_SIDE_PX = 512;
const JPEG_QUALITY = 0.85;

function initRows() {
  const saved = safeLSGet(PROFILE_KEY, null);
  if (saved && Array.isArray(saved)) {
    rows.value = defaultRows.map((r) => {
      const found = saved.find((s) => s.key === r.key);
      return found ? { ...r, value: found.value } : r;
    });
  } else {
    rows.value = defaultRows.map((r) => ({ ...r }));
  }
  if (user.value) syncFromUser();
}

function syncFromUser() {
  const u = user.value;
  rows.value.forEach((r) => {
    if (r.field && u[r.field] !== undefined) {
      r.value = String(u[r.field]);
    }
  });
}

function persistRows() {
  safeLSSet(PROFILE_KEY, rows.value.map((r) => ({ key: r.key, value: r.value })));
}

function edit(row) {
  editing.value = row;
  editValue.value = row.value;
}

async function save() {
  if (!editing.value) return;
  const newVal = editValue.value.trim();
  if (!newVal) {
    toast("内容不能为空");
    return;
  }
  showLoading("保存中");
  try {
    editing.value.value = newVal;
    persistRows();
    if (editing.value.field && user.value) {
      await updateUser({ [editing.value.field]: newVal });
    }
    editing.value = null;
    toast("已保存");
  } finally {
    hideLoading();
  }
}

function chooseAvatar() {
  selectedAvatar.value = user.value?.avatarUrl || avatarOptions[0];
  customAvatar.value = "";
  if (fileInputRef.value) fileInputRef.value.value = "";
  showAvatarPicker.value = true;
}

async function saveAvatar() {
  if (!selectedAvatar.value) return;
  showLoading("更新头像中");
  try {
    const res = await updateAvatar(selectedAvatar.value);
    if (res.code === 200) {
      showAvatarPicker.value = false;
      toast("头像已更新");
    }
  } finally {
    hideLoading();
  }
}

function triggerFilePick() {
  if (fileInputRef.value) fileInputRef.value.click();
}

function onFileChange(e) {
  const file = e?.target?.files?.[0];
  if (!file) return;
  handleFile(file).finally(() => {
    if (fileInputRef.value) fileInputRef.value.value = "";
  });
}

async function handleFile(file) {
  if (!ALLOWED_MIME.includes(file.type)) {
    toast("只支持 PNG / JPG / GIF / WebP 格式");
    return;
  }
  if (file.size > MAX_FILE_BYTES) {
    toast("图片过大，请选择 8MB 以内的图片");
    return;
  }
  showLoading("处理图片中");
  try {
    const dataUrl = await readFileAsDataURL(file);
    const compressed = await compressImageDataUrl(dataUrl, file.type);
    customAvatar.value = compressed;
    selectedAvatar.value = compressed;
  } catch (e) {
    toast("图片读取失败，请换一张试试");
  } finally {
    hideLoading();
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read_error"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

function compressImageDataUrl(dataUrl, originalType) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error("img_error"));
    img.onload = () => {
      try {
        let { naturalWidth: w, naturalHeight: h } = img;
        const scale = Math.min(1, MAX_SIDE_PX / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(dataUrl); return; }
        if (originalType === "image/jpeg" || originalType === "image/jpg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, w, h);
        }
        ctx.drawImage(img, 0, 0, w, h);
        const outType = (originalType === "image/png" || originalType === "image/gif" || originalType === "image/webp")
          ? originalType
          : "image/jpeg";
        const quality = (outType === "image/jpeg" || outType === "image/webp") ? JPEG_QUALITY : undefined;
        const out = canvas.toDataURL(outType, quality);
        resolve(out && out.length < dataUrl.length ? out : dataUrl);
      } catch (e) {
        resolve(dataUrl);
      }
    };
    img.src = dataUrl;
  });
}

onMounted(async () => {
  await loadUser(true);
  initRows();
});
</script>

<style scoped>
.profile__avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 0 10px;
}
.profile__avatar {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: var(--color-primary-tint);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid var(--color-primary-muted);
}
.profile__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.profile__avatar-btn {
  margin-top: 10px;
  font-size: 13px;
  color: var(--color-primary);
  font-weight: 500;
}

.profile__group {
  padding: 0 var(--page-padding);
  margin-top: 10px;
}
.profile__label {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}
.profile__field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-card);
  border-radius: var(--radius-card);
  padding: 13px 14px;
  font-size: 14px;
}
.profile__field:active {
  background: var(--color-input-bg);
}

.edit-mask {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}
.edit-box {
  width: calc(100% - 64px);
  max-width: 340px;
  background: #fff;
  border-radius: 14px;
  padding: 18px;
}
.edit-box__label {
  font-weight: 600;
  margin-bottom: 10px;
}
.edit-box__input {
  width: 100%;
  border-bottom: 1.5px solid var(--color-primary);
  padding: 8px 2px;
  font-size: 15px;
}
.edit-box__btns {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 14px;
}
.edit-box__btn {
  font-size: 14px;
  color: var(--color-text-caption);
  padding: 4px 6px;
}
.edit-box__btn--ok {
  color: var(--color-primary);
  font-weight: 600;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 12px 0 8px;
}
.avatar-opt {
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--color-divider);
  cursor: pointer;
  background: var(--color-primary-tint);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}
.avatar-opt img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-opt__text {
  font-size: 24px;
  color: var(--color-primary);
}
.avatar-opt--on {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-tint);
}
.avatar-opt--upload {
  aspect-ratio: auto;
  grid-column: 1 / -1;
  border-radius: 14px;
  padding: 14px;
  background: #f5faf6;
  border: 1.5px dashed #a9c9b2;
  color: var(--color-primary);
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
}
.avatar-opt--upload:hover,
.avatar-opt--upload.avatar-opt--on {
  border-color: var(--color-primary);
  background: #eaf4ec;
  border-style: solid;
}
.avatar-opt--upload .avatar-opt__text {
  font-size: 12px;
  color: inherit;
  font-weight: 600;
}
.avatar-opt__file {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
</style>
