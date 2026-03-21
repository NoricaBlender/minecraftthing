import { Crosshair } from "../rendering/crosshair";
import { createElement } from "../utils/helpers";
import { Hotbar } from "./hotbar";

export class Hud {
  private readonly root = createElement("div", "hud-root");
  private readonly topRow = createElement("div", "hud-top");
  private readonly status = createElement("div", "hud-status");
  private readonly crosshair: Crosshair;
  private readonly hotbar: Hotbar;

  public constructor(parent: HTMLElement) {
    this.topRow.appendChild(this.status);
    this.root.appendChild(this.topRow);
    parent.appendChild(this.root);

    this.crosshair = new Crosshair(this.root);
    this.hotbar = new Hotbar(this.root);
  }

  public update(selectedIndex: number, pointerLocked: boolean): void {
    this.status.textContent = pointerLocked
      ? "Esc to release mouse"
      : "Click to capture mouse";
    this.hotbar.update(selectedIndex);
  }

  public dispose(): void {
    this.crosshair.dispose();
    this.hotbar.dispose();
    this.root.remove();
  }
}
