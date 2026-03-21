import { GAME_CONFIG } from "../core/config";
import { createElement } from "../utils/helpers";
import { getBlockFaceColor, getBlockName } from "../world/blockTypes";

export class Hotbar {
  private readonly wrapper = createElement("div", "hotbar-wrap");
  private readonly label = createElement("div", "selected-block-label");
  private readonly bar = createElement("div", "hotbar");
  private readonly slots: HTMLDivElement[] = [];

  public constructor(parent: HTMLElement) {
    this.wrapper.append(this.label, this.bar);
    parent.appendChild(this.wrapper);

    GAME_CONFIG.ui.hotbarBlocks.forEach((blockId, index) => {
      const slot = createElement("div", "hotbar-slot");
      const keyLabel = createElement("span", "hotbar-key", `${index + 1}`);
      const swatch = createElement("div", "hotbar-swatch");
      const topColor = getBlockFaceColor(blockId, "top");
      const sideColor = getBlockFaceColor(blockId, "side");

      swatch.style.background = `linear-gradient(180deg, rgb(${Math.round(
        topColor[0] * 255,
      )}, ${Math.round(topColor[1] * 255)}, ${Math.round(
        topColor[2] * 255,
      )}) 0%, rgb(${Math.round(sideColor[0] * 255)}, ${Math.round(
        sideColor[1] * 255,
      )}, ${Math.round(sideColor[2] * 255)}) 100%)`;

      slot.append(keyLabel, swatch);
      this.bar.appendChild(slot);
      this.slots.push(slot);
    });
  }

  public update(selectedIndex: number): void {
    this.slots.forEach((slot, index) => {
      slot.classList.toggle("active", index === selectedIndex);
    });

    this.label.textContent = getBlockName(
      GAME_CONFIG.ui.hotbarBlocks[selectedIndex],
    );
  }

  public dispose(): void {
    this.wrapper.remove();
  }
}
