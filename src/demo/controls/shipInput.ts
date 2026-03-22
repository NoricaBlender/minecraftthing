import { Scalar } from "@babylonjs/core";

export interface ShipControlState {
  readonly throttle: number;
  readonly steer: number;
  readonly boost: boolean;
}

export class ShipInputController {
  private readonly pressedKeys = new Set<string>();
  private resetRequested = false;

  public constructor() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleBlur);
  }

  public getState(): ShipControlState {
    const throttle =
      this.axisValue("KeyW", "ArrowUp") - this.axisValue("KeyS", "ArrowDown");
    const steer =
      this.axisValue("KeyD", "ArrowRight") -
      this.axisValue("KeyA", "ArrowLeft");

    return {
      throttle: Scalar.Clamp(throttle, -1, 1),
      steer: Scalar.Clamp(steer, -1, 1),
      boost:
        this.pressedKeys.has("ShiftLeft") || this.pressedKeys.has("ShiftRight"),
    };
  }

  public consumeResetRequest(): boolean {
    const shouldReset = this.resetRequested;
    this.resetRequested = false;
    return shouldReset;
  }

  public dispose(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.handleBlur);
    this.pressedKeys.clear();
  }

  private axisValue(primaryCode: string, secondaryCode: string): number {
    return this.pressedKeys.has(primaryCode) || this.pressedKeys.has(secondaryCode)
      ? 1
      : 0;
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.isTrackedKey(event.code)) {
      event.preventDefault();
    }

    this.pressedKeys.add(event.code);

    if (event.code === "KeyR") {
      this.resetRequested = true;
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.code);
  };

  private readonly handleBlur = (): void => {
    this.pressedKeys.clear();
  };

  private isTrackedKey(code: string): boolean {
    return (
      code === "KeyW" ||
      code === "KeyA" ||
      code === "KeyS" ||
      code === "KeyD" ||
      code === "KeyR" ||
      code === "ArrowUp" ||
      code === "ArrowDown" ||
      code === "ArrowLeft" ||
      code === "ArrowRight" ||
      code === "ShiftLeft" ||
      code === "ShiftRight"
    );
  }
}
