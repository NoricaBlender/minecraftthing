import { Vector3 } from "@babylonjs/core";

import { GAME_CONFIG } from "../core/config";
import { BlockHighlight } from "../rendering/highlight";
import type { Aabb } from "../utils/math";
import { intersectsAabb } from "../utils/math";
import { BlockId } from "../world/blockTypes";
import type { BlockRaycastHit } from "../world/worldManager";
import { WorldManager } from "../world/worldManager";
import { PlayerController } from "./playerController";

export class BlockInteractor {
  private readonly rayOrigin = new Vector3();
  private readonly rayDirection = new Vector3();
  private currentTarget: BlockRaycastHit | null = null;

  public constructor(
    private readonly world: WorldManager,
    private readonly player: PlayerController,
    private readonly highlight: BlockHighlight,
  ) {}

  public updateTarget(): BlockRaycastHit | null {
    this.player.copyEyePositionTo(this.rayOrigin);
    this.player.copyLookDirectionTo(this.rayDirection);

    this.currentTarget = this.world.raycastSolidBlock(
      this.rayOrigin,
      this.rayDirection,
      GAME_CONFIG.player.reachDistance,
    );

    if (this.currentTarget) {
      this.highlight.show(
        this.currentTarget.blockX,
        this.currentTarget.blockY,
        this.currentTarget.blockZ,
      );
    } else {
      this.highlight.hide();
    }

    return this.currentTarget;
  }

  public tryBreakTargetBlock(): boolean {
    if (!this.currentTarget) {
      return false;
    }

    const { blockX, blockY, blockZ } = this.currentTarget;
    if (!this.world.isBreakableBlockAt(blockX, blockY, blockZ)) {
      return false;
    }

    const changed = this.world.setBlock(blockX, blockY, blockZ, BlockId.Air);
    if (changed) {
      this.updateTarget();
    }
    return changed;
  }

  public tryPlaceSelectedBlock(blockId: BlockId): boolean {
    if (!this.currentTarget || blockId === BlockId.Air) {
      return false;
    }

    const { placeX, placeY, placeZ } = this.currentTarget;
    if (
      !this.world.inWorldBounds(placeX, placeY, placeZ) ||
      this.world.getBlock(placeX, placeY, placeZ) !== BlockId.Air
    ) {
      return false;
    }

    if (
      this.wouldPlaceInsidePlayer(
        placeX,
        placeY,
        placeZ,
        this.player.getBodyAabb(),
      )
    ) {
      return false;
    }

    const changed = this.world.setBlock(placeX, placeY, placeZ, blockId);
    if (changed) {
      this.updateTarget();
    }
    return changed;
  }

  public getCurrentTarget(): BlockRaycastHit | null {
    return this.currentTarget;
  }

  private wouldPlaceInsidePlayer(
    x: number,
    y: number,
    z: number,
    playerAabb: Aabb,
  ): boolean {
    return intersectsAabb(playerAabb, {
      minX: x,
      minY: y,
      minZ: z,
      maxX: x + 1,
      maxY: y + 1,
      maxZ: z + 1,
    });
  }
}
