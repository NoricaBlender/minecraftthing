import { Engine } from "@babylonjs/core";

export class EngineManager {
  public readonly canvas: HTMLCanvasElement;
  public readonly engine: Engine;

  public constructor(private readonly root: HTMLElement) {
    this.canvas = document.createElement("canvas");
    this.canvas.id = "game-canvas";
    this.canvas.tabIndex = 1;
    this.root.appendChild(this.canvas);

    this.engine = new Engine(this.canvas, true, {
      adaptToDeviceRatio: true,
      antialias: true,
      preserveDrawingBuffer: false,
      stencil: true,
    });

    window.addEventListener("resize", this.handleResize);
  }

  public dispose(): void {
    window.removeEventListener("resize", this.handleResize);
    this.engine.dispose();
    this.canvas.remove();
  }

  private readonly handleResize = (): void => {
    this.engine.resize();
  };
}
