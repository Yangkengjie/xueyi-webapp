/* 全局轻提示：与反馈单例，任何组件 import { toast } from "../utils/toast" 即可 */
import { reactive } from "vue";

export const toastState = reactive({
  visible: false,
  message: "",
  _timer: null,
});

export function toast(message, duration = 1800) {
  toastState.message = message;
  toastState.visible = true;
  clearTimeout(toastState._timer);
  toastState._timer = setTimeout(() => (toastState.visible = false), duration);
}

/* 全局加载遮罩：深色圆角方块 + 转圈 + 文案（对应设计稿「各种操作显示」） */
export const loadingState = reactive({ visible: false, text: "加载中" });

export function showLoading(text = "加载中") {
  loadingState.text = text;
  loadingState.visible = true;
}
export function hideLoading() {
  loadingState.visible = false;
}
