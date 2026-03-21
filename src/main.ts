import { Game } from "./core/game";
import "./styles.css";

const root = document.getElementById("app");

if (!(root instanceof HTMLElement)) {
  throw new Error("App root element not found.");
}

const game = new Game(root);
game.start();

window.addEventListener("beforeunload", () => {
  game.dispose();
});
