import { BuoyancyDemoApp } from "./demo/app";
import "./styles.css";

const root = document.getElementById("app");

if (!(root instanceof HTMLElement)) {
  throw new Error("App root element not found.");
}

const app = new BuoyancyDemoApp(root);
app.start();

window.addEventListener("beforeunload", () => {
  app.dispose();
});
