import "./styles.css";
import { createStore } from "./store.js";
import { createApp } from "./app.js";

const store = createStore();
createApp(document.getElementById("app"), store);
