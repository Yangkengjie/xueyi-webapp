import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./styles/base.css";
import { useStore } from "./composables/useStore";

const { initializeStore } = useStore();
initializeStore();

createApp(App).use(router).mount("#app");
