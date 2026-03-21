import { Vector3 } from "@babylonjs/core";

import { GAME_CONFIG } from "../core/config";
import type { Aabb } from "../utils/math";
import { WorldManager } from "../world/worldManager";

export interface PlayerState {
  position: Vector3;
  velocity: Vector3;
  grounded: boolean;
}

export interface MovementIntent {
  forward: number;
  strafe: number;
  jump: boolean;
  sprint: boolean;
  yaw: number;
}

type Axis = "x" | "y" | "z";

export class PlayerPhysics {
  public constructor(private readonly world: WorldManager) {}

  public update(
    state: PlayerState,
    intent: MovementIntent,
    deltaSeconds: number,
  ): void {
    const speed = intent.sprint
      ? GAME_CONFIG.player.sprintSpeed
      : GAME_CONFIG.player.walkSpeed;

    const inputLength = Math.hypot(intent.strafe, intent.forward);
    let moveX = 0;
    let moveZ = 0;

    if (inputLength > 0) {
      const forwardInput = intent.forward / inputLength;
      const strafeInput = intent.strafe / inputLength;
      const forwardX = Math.sin(intent.yaw);
      const forwardZ = Math.cos(intent.yaw);
      const rightX = Math.cos(intent.yaw);
      const rightZ = -Math.sin(intent.yaw);

      moveX = (forwardX * forwardInput + rightX * strafeInput) * speed;
      moveZ = (forwardZ * forwardInput + rightZ * strafeInput) * speed;
    }

    state.velocity.x = moveX;
    state.velocity.z = moveZ;

    if (state.grounded && state.velocity.y < 0) {
      state.velocity.y = 0;
    }

    if (state.grounded && intent.jump) {
      state.velocity.y = GAME_CONFIG.player.jumpVelocity;
      state.grounded = false;
    }

    state.velocity.y -= GAME_CONFIG.player.gravity * deltaSeconds;
    state.grounded = false;

    this.moveAxis(state, "x", state.velocity.x * deltaSeconds);
    this.moveAxis(state, "y", state.velocity.y * deltaSeconds);
    this.moveAxis(state, "z", state.velocity.z * deltaSeconds);
  }

  public getBodyAabb(position: Vector3): Aabb {
    const halfWidth = GAME_CONFIG.player.width * 0.5;

    return {
      minX: position.x - halfWidth,
      minY: position.y,
      minZ: position.z - halfWidth,
      maxX: position.x + halfWidth,
      maxY: position.y + GAME_CONFIG.player.height,
      maxZ: position.z + halfWidth,
    };
  }

  private moveAxis(state: PlayerState, axis: Axis, delta: number): void {
    if (delta === 0) {
      return;
    }

    this.addAxis(state.position, axis, delta);

    if (!this.intersectsSolid(state.position)) {
      return;
    }

    const aabb = this.getBodyAabb(state.position);
    const minX = Math.floor(aabb.minX + GAME_CONFIG.player.collisionPadding);
    const maxX = Math.floor(aabb.maxX - GAME_CONFIG.player.collisionPadding);
    const minY = Math.floor(aabb.minY + GAME_CONFIG.player.collisionPadding);
    const maxY = Math.floor(aabb.maxY - GAME_CONFIG.player.collisionPadding);
    const minZ = Math.floor(aabb.minZ + GAME_CONFIG.player.collisionPadding);
    const maxZ = Math.floor(aabb.maxZ - GAME_CONFIG.player.collisionPadding);
    const halfWidth = GAME_CONFIG.player.width * 0.5;

    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        for (let z = minZ; z <= maxZ; z += 1) {
          if (!this.world.isSolidBlockAt(x, y, z)) {
            continue;
          }

          switch (axis) {
            case "x":
              if (delta > 0) {
                state.position.x = Math.min(
                  state.position.x,
                  x - halfWidth - GAME_CONFIG.player.collisionPadding,
                );
              } else {
                state.position.x = Math.max(
                  state.position.x,
                  x + 1 + halfWidth + GAME_CONFIG.player.collisionPadding,
                );
              }
              state.velocity.x = 0;
              break;
            case "y":
              if (delta > 0) {
                state.position.y = Math.min(
                  state.position.y,
                  y - GAME_CONFIG.player.height - GAME_CONFIG.player.collisionPadding,
                );
              } else {
                state.position.y = Math.max(
                  state.position.y,
                  y + 1 + GAME_CONFIG.player.collisionPadding,
                );
                state.grounded = true;
              }
              state.velocity.y = 0;
              break;
            case "z":
              if (delta > 0) {
                state.position.z = Math.min(
                  state.position.z,
                  z - halfWidth - GAME_CONFIG.player.collisionPadding,
                );
              } else {
                state.position.z = Math.max(
                  state.position.z,
                  z + 1 + halfWidth + GAME_CONFIG.player.collisionPadding,
                );
              }
              state.velocity.z = 0;
              break;
          }
        }
      }
    }
  }

  private intersectsSolid(position: Vector3): boolean {
    const aabb = this.getBodyAabb(position);
    const minX = Math.floor(aabb.minX + GAME_CONFIG.player.collisionPadding);
    const maxX = Math.floor(aabb.maxX - GAME_CONFIG.player.collisionPadding);
    const minY = Math.floor(aabb.minY + GAME_CONFIG.player.collisionPadding);
    const maxY = Math.floor(aabb.maxY - GAME_CONFIG.player.collisionPadding);
    const minZ = Math.floor(aabb.minZ + GAME_CONFIG.player.collisionPadding);
    const maxZ = Math.floor(aabb.maxZ - GAME_CONFIG.player.collisionPadding);

    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        for (let z = minZ; z <= maxZ; z += 1) {
          if (this.world.isSolidBlockAt(x, y, z)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private addAxis(position: Vector3, axis: Axis, delta: number): void {
    switch (axis) {
      case "x":
        position.x += delta;
        break;
      case "y":
        position.y += delta;
        break;
      case "z":
        position.z += delta;
        break;
    }
  }
}
