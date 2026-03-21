import type { Mesh } from "@babylonjs/core";

import { GAME_CONFIG } from "../core/config";
import { BlockId } from "./blockTypes";

const {
  chunkSizeX: CHUNK_SIZE_X,
  chunkSizeY: CHUNK_SIZE_Y,
  chunkSizeZ: CHUNK_SIZE_Z,
} = GAME_CONFIG.world;

export class Chunk {
  public readonly blocks = new Uint8Array(
    CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z,
  );

  public mesh: Mesh | null = null;
  public isDirty = true;
  public isGenerated = false;

  public constructor(
    public readonly chunkX: number,
    public readonly chunkZ: number,
  ) {}

  public get worldOriginX(): number {
    return this.chunkX * CHUNK_SIZE_X;
  }

  public get worldOriginZ(): number {
    return this.chunkZ * CHUNK_SIZE_Z;
  }

  public containsLocal(localX: number, y: number, localZ: number): boolean {
    return (
      localX >= 0 &&
      localX < CHUNK_SIZE_X &&
      y >= 0 &&
      y < CHUNK_SIZE_Y &&
      localZ >= 0 &&
      localZ < CHUNK_SIZE_Z
    );
  }

  public getBlock(localX: number, y: number, localZ: number): BlockId {
    if (!this.containsLocal(localX, y, localZ)) {
      return BlockId.Air;
    }

    return this.blocks[this.toIndex(localX, y, localZ)] as BlockId;
  }

  public setBlock(
    localX: number,
    y: number,
    localZ: number,
    blockId: BlockId,
  ): boolean {
    if (!this.containsLocal(localX, y, localZ)) {
      return false;
    }

    const index = this.toIndex(localX, y, localZ);

    if (this.blocks[index] === blockId) {
      return false;
    }

    this.blocks[index] = blockId;
    this.isDirty = true;

    return true;
  }

  public clearMesh(): void {
    if (this.mesh) {
      this.mesh.dispose();
      this.mesh = null;
    }
  }

  public dispose(): void {
    this.clearMesh();
  }

  private toIndex(localX: number, y: number, localZ: number): number {
    return localX + localZ * CHUNK_SIZE_X + y * CHUNK_SIZE_X * CHUNK_SIZE_Z;
  }
}
