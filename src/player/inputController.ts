import { positiveMod } from "../utils/math";

interface MoveAxes {
  forward: number;
  strafe: number;
}

export class InputController {
  private readonly pressedKeys = new Set<string>();
  private lookDeltaX = 0;
  private lookDeltaY = 0;
  private pendingJump = false;
  private pendingBreak = false;
  private pendingPlace = false;
  private pendingScrollSteps = 0;
  private pendingDirectSlot: number | null = null;
  private pointerLocked = false;

  public constructor(private readonly canvas: HTMLCanvasElement) {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("contextmenu", this.handleContextMenu);
    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("wheel", this.handleWheel, { passive: false });
    document.addEventListener("pointerlockchange", this.handlePointerLockChange);
  }

  public getMoveAxes(): MoveAxes {
    let forward = 0;
    let strafe = 0;

    if (this.pressedKeys.has("KeyW")) {
      forward += 1;
    }
    if (this.pressedKeys.has("KeyS")) {
      forward -= 1;
    }
    if (this.pressedKeys.has("KeyD")) {
      strafe += 1;
    }
    if (this.pressedKeys.has("KeyA")) {
      strafe -= 1;
    }

    return { forward, strafe };
  }

  public isSprintHeld(): boolean {
    return (
      this.pressedKeys.has("ShiftLeft") || this.pressedKeys.has("ShiftRight")
    );
  }

  public isPointerLocked(): boolean {
    return this.pointerLocked;
  }

  public consumeLookDelta(): { deltaX: number; deltaY: number } {
    const result = {
      deltaX: this.lookDeltaX,
      deltaY: this.lookDeltaY,
    };
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;
    return result;
  }

  public consumeJumpAction(): boolean {
    const jump = this.pendingJump;
    this.pendingJump = false;
    return jump;
  }

  public consumeBreakAction(): boolean {
    const action = this.pendingBreak;
    this.pendingBreak = false;
    return action;
  }

  public consumePlaceAction(): boolean {
    const action = this.pendingPlace;
    this.pendingPlace = false;
    return action;
  }

  public consumeHotbarSelection(
    currentIndex: number,
    slotCount: number,
  ): number {
    let nextIndex = currentIndex;

    if (
      this.pendingDirectSlot !== null &&
      this.pendingDirectSlot >= 0 &&
      this.pendingDirectSlot < slotCount
    ) {
      nextIndex = this.pendingDirectSlot;
    }

    if (this.pendingScrollSteps !== 0) {
      nextIndex = positiveMod(
        nextIndex + this.pendingScrollSteps,
        slotCount,
      );
    }

    this.pendingDirectSlot = null;
    this.pendingScrollSteps = 0;

    return nextIndex;
  }

  public dispose(): void {
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("contextmenu", this.handleContextMenu);
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("wheel", this.handleWheel);
    document.removeEventListener(
      "pointerlockchange",
      this.handlePointerLockChange,
    );
  }

  private readonly handleMouseDown = (event: MouseEvent): void => {
    event.preventDefault();

    if (!this.pointerLocked) {
      void this.canvas.requestPointerLock();
      return;
    }

    if (event.button === 0) {
      this.pendingBreak = true;
    } else if (event.button === 2) {
      this.pendingPlace = true;
    }
  };

  private readonly handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  private readonly handleMouseMove = (event: MouseEvent): void => {
    if (!this.pointerLocked) {
      return;
    }

    this.lookDeltaX += event.movementX;
    this.lookDeltaY += event.movementY;
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.pressedKeys.add(event.code);

    if (event.code === "Space" && !event.repeat) {
      event.preventDefault();
      this.pendingJump = true;
    }

    if (event.code.startsWith("Digit") && !event.repeat) {
      const numericIndex = Number(event.code.replace("Digit", "")) - 1;
      if (!Number.isNaN(numericIndex)) {
        this.pendingDirectSlot = numericIndex;
      }
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.code);
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault();

    if (event.deltaY > 0) {
      this.pendingScrollSteps += 1;
    } else if (event.deltaY < 0) {
      this.pendingScrollSteps -= 1;
    }
  };

  private readonly handlePointerLockChange = (): void => {
    this.pointerLocked = document.pointerLockElement === this.canvas;
  };
}
