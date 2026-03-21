import { UniversalCamera, Vector3 } from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";

import { GAME_CONFIG } from "../core/config";
import type { Aabb } from "../utils/math";
import { clamp } from "../utils/math";
import { BlockId } from "../world/blockTypes";
import { WorldManager } from "../world/worldManager";
import { InputController } from "./inputController";
import { PlayerPhysics, type PlayerState } from "./playerPhysics";

export class PlayerController {
  private readonly camera: UniversalCamera;
  private readonly physics: PlayerPhysics;
  private readonly state: PlayerState;
  private yaw = Math.PI;
  private pitch = 0;
  private selectedHotbarIndex = 0;

  public constructor(
    scene: Scene,
    spawnPosition: Vector3,
    private readonly input: InputController,
    world: WorldManager,
  ) {
    this.physics = new PlayerPhysics(world);
    this.state = {
      position: spawnPosition.clone(),
      velocity: Vector3.Zero(),
      grounded: false,
    };

    this.camera = new UniversalCamera(
      "player-camera",
      spawnPosition.clone(),
      scene,
    );
    this.camera.minZ = 0.05;
    this.camera.fov = 1.15;
    this.camera.rotation.set(0, this.yaw, 0);
    scene.activeCamera = this.camera;

    this.syncCamera();
  }

  public update(deltaSeconds: number): void {
    const look = this.input.consumeLookDelta();
    this.yaw -= look.deltaX * GAME_CONFIG.player.mouseSensitivity;
    this.pitch = clamp(
      this.pitch - look.deltaY * GAME_CONFIG.player.mouseSensitivity,
      -GAME_CONFIG.player.maxPitch,
      GAME_CONFIG.player.maxPitch,
    );

    this.selectedHotbarIndex = this.input.consumeHotbarSelection(
      this.selectedHotbarIndex,
      GAME_CONFIG.ui.hotbarBlocks.length,
    );

    const axes = this.input.getMoveAxes();
    this.physics.update(
      this.state,
      {
        forward: axes.forward,
        strafe: axes.strafe,
        jump: this.input.consumeJumpAction(),
        sprint: this.input.isSprintHeld(),
        yaw: this.yaw,
      },
      deltaSeconds,
    );

    this.syncCamera();
  }

  public getPosition(): Vector3 {
    return this.state.position;
  }

  public getSelectedBlockId(): BlockId {
    return GAME_CONFIG.ui.hotbarBlocks[this.selectedHotbarIndex];
  }

  public getSelectedBlockIndex(): number {
    return this.selectedHotbarIndex;
  }

  public getBodyAabb(): Aabb {
    return this.physics.getBodyAabb(this.state.position);
  }

  public copyEyePositionTo(target: Vector3): Vector3 {
    target.set(
      this.state.position.x,
      this.state.position.y + GAME_CONFIG.player.eyeHeight,
      this.state.position.z,
    );
    return target;
  }

  public copyLookDirectionTo(target: Vector3): Vector3 {
    const cosPitch = Math.cos(this.pitch);
    target.set(
      Math.sin(this.yaw) * cosPitch,
      Math.sin(this.pitch),
      Math.cos(this.yaw) * cosPitch,
    );
    return target.normalize();
  }

  private syncCamera(): void {
    this.camera.position.set(
      this.state.position.x,
      this.state.position.y + GAME_CONFIG.player.eyeHeight,
      this.state.position.z,
    );
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
}
