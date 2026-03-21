import { createElement } from "../utils/helpers";

export class Crosshair {
  private readonly element = createElement("div", "crosshair");

  public constructor(parent: HTMLElement) {
    parent.appendChild(this.element);
  }

  public dispose(): void {
    this.element.remove();
  }
}
