import { createApp } from "vue";
import { createPinia } from "pinia";
import VueKonva from "vue-konva";

import App from "./App.vue";
import router from "./router";
import "./style.css";

createApp(App).use(router).use(createPinia()).use(VueKonva).mount("#app");
