import { Scene, StandardMaterial, Vector3 } from "@babylonjs/core";

import { GAME_CONFIG } from "../core/config";
import { floorDiv, positiveMod } from "../utils/math";
import { BlockId, isBreakableBlock, isSolidBlock } from "./blockTypes";
import { ChunkManager } from "./chunkManager";
import { TerrainGenerator } from "./terrainGenerator";
import { WorldStorage } from "./worldStorage";

export interface SetBlockOptions {
  persist?: boolean;
  markDirty?: boolean;
}

export interface BlockRaycastHit {
  blockX: number;
  blockY: number;
  blockZ: number;
  placeX: number;
  placeY: number;
  placeZ: number;
  normalX: number;
  normalY: number;
  normalZ: number;
  distance: number;
}

const {
  chunkSizeX,
  chunkSizeY,
  chunkSizeZ,
  renderDistance,
  seed,
  storageKeyPrefix,
  worldChunkRadius,
} = GAME_CONFIG.world;

export class WorldManager {
  private readonly chunkManager: ChunkManager;
  private readonly terrainGenerator = new TerrainGenerator(seed);
  private readonly storage = new WorldStorage(storageKeyPrefix, seed);
  private readonly minWorldX = -worldChunkRadius * chunkSizeX;
  private readonly maxWorldXExclusive = (worldChunkRadius + 1) * chunkSizeX;
  private readonly minWorldZ = -worldChunkRadius * chunkSizeZ;
  private readonly maxWorldZExclusive = (worldChunkRadius + 1) * chunkSizeZ;
  private readonly spawnPosition: Vector3;

  public constructor(scene: Scene, chunkMaterial: StandardMaterial) {
    this.chunkManager = new ChunkManager(scene, chunkMaterial);
    this.createChunks();
    this.generateTerrain();
    this.applyStoredEdits();
    this.spawnPosition = this.resolveSpawnPosition();
  }

  public update(playerPosition: Vector3): void {
    const centerChunkX = floorDiv(playerPosition.x, chunkSizeX);
    const centerChunkZ = floorDiv(playerPosition.z, chunkSizeZ);

    this.chunkManager.updateVisibleChunks(
      centerChunkX,
      centerChunkZ,
      renderDistance,
      (x, y, z) => this.getBlock(x, y, z),
    );
  }

  public getSpawnPosition(): Vector3 {
    return this.spawnPosition.clone();
  }

  public inWorldBounds(x: number, y: number, z: number): boolean {
    return (
      y >= 0 &&
      y < chunkSizeY &&
      x >= this.minWorldX &&
      x < this.maxWorldXExclusive &&
      z >= this.minWorldZ &&
      z < this.maxWorldZExclusive
    );
  }

  public getBlock(x: number, y: number, z: number): BlockId {
    if (!this.inWorldBounds(x, y, z)) {
      return BlockId.Air;
    }

    const chunk = this.chunkManager.getChunk(
      floorDiv(x, chunkSizeX),
      floorDiv(z, chunkSizeZ),
    );
    if (!chunk) {
      return BlockId.Air;
    }

    return chunk.getBlock(
      positiveMod(x, chunkSizeX),
      y,
      positiveMod(z, chunkSizeZ),
    );
  }

  public setBlock(
    x: number,
    y: number,
    z: number,
    blockId: BlockId,
    options: SetBlockOptions = {},
  ): boolean {
    if (!this.inWorldBounds(x, y, z)) {
      return false;
    }

    const chunkX = floorDiv(x, chunkSizeX);
    const chunkZ = floorDiv(z, chunkSizeZ);
    const chunk = this.chunkManager.getChunk(chunkX, chunkZ);
    if (!chunk) {
      return false;
    }

    const localX = positiveMod(x, chunkSizeX);
    const localZ = positiveMod(z, chunkSizeZ);
    const changed = chunk.setBlock(localX, y, localZ, blockId);
    if (!changed) {
      return false;
    }

    if (options.persist !== false) {
      this.storage.recordEdit(x, y, z, blockId);
    }

    if (options.markDirty !== false) {
      this.markBlockAndNeighborsDirty(chunkX, chunkZ, localX, localZ);
    }

    return true;
  }

  public isSolidBlockAt(x: number, y: number, z: number): boolean {
    return isSolidBlock(this.getBlock(x, y, z));
  }

  public isBreakableBlockAt(x: number, y: number, z: number): boolean {
    return isBreakableBlock(this.getBlock(x, y, z));
  }

  public getSurfaceHeight(x: number, z: number): number {
    for (let y = chunkSizeY - 1; y >= 0; y -= 1) {
      if (this.getBlock(x, y, z) !== BlockId.Air) {
        return y;
      }
    }

    return -1;
  }

  public raycastSolidBlock(
    origin: Vector3,
    direction: Vector3,
    maxDistance: number,
  ): BlockRaycastHit | null {
    if (direction.x === 0 && direction.y === 0 && direction.z === 0) {
      return null;
    }

    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const stepX = direction.x > 0 ? 1 : direction.x < 0 ? -1 : 0;
    const stepY = direction.y > 0 ? 1 : direction.y < 0 ? -1 : 0;
    const stepZ = direction.z > 0 ? 1 : direction.z < 0 ? -1 : 0;

    const tDeltaX =
      stepX === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / direction.x);
    const tDeltaY =
      stepY === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / direction.y);
    const tDeltaZ =
      stepZ === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / direction.z);

    const nextBoundaryX = stepX > 0 ? x + 1 : x;
    const nextBoundaryY = stepY > 0 ? y + 1 : y;
    const nextBoundaryZ = stepZ > 0 ? z + 1 : z;

    let tMaxX =
      stepX === 0
        ? Number.POSITIVE_INFINITY
        : Math.abs((nextBoundaryX - origin.x) / direction.x);
    let tMaxY =
      stepY === 0
        ? Number.POSITIVE_INFINITY
        : Math.abs((nextBoundaryY - origin.y) / direction.y);
    let tMaxZ =
      stepZ === 0
        ? Number.POSITIVE_INFINITY
        : Math.abs((nextBoundaryZ - origin.z) / direction.z);

    let normalX = 0;
    let normalY = 0;
    let normalZ = 0;
    let distance = 0;

    while (distance <= maxDistance) {
      if (this.isSolidBlockAt(x, y, z)) {
        return {
          blockX: x,
          blockY: y,
          blockZ: z,
          placeX: x + normalX,
          placeY: y + normalY,
          placeZ: z + normalZ,
          normalX,
          normalY,
          normalZ,
          distance,
        };
      }

      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          x += stepX;
          distance = tMaxX;
          tMaxX += tDeltaX;
          normalX = -stepX;
          normalY = 0;
          normalZ = 0;
        } else {
          z += stepZ;
          distance = tMaxZ;
          tMaxZ += tDeltaZ;
          normalX = 0;
          normalY = 0;
          normalZ = -stepZ;
        }
      } else if (tMaxY < tMaxZ) {
        y += stepY;
        distance = tMaxY;
        tMaxY += tDeltaY;
        normalX = 0;
        normalY = -stepY;
        normalZ = 0;
      } else {
        z += stepZ;
        distance = tMaxZ;
        tMaxZ += tDeltaZ;
        normalX = 0;
        normalY = 0;
        normalZ = -stepZ;
      }
    }

    return null;
  }

  public dispose(): void {
    this.chunkManager.dispose();
  }

  private createChunks(): void {
    for (let chunkX = -worldChunkRadius; chunkX <= worldChunkRadius; chunkX += 1) {
      for (
        let chunkZ = -worldChunkRadius;
        chunkZ <= worldChunkRadius;
        chunkZ += 1
      ) {
        this.chunkManager.createChunk(chunkX, chunkZ);
      }
    }
  }

  private generateTerrain(): void {
    for (const chunk of this.chunkManager.getAllChunks()) {
      this.terrainGenerator.generateBaseTerrain(chunk);
    }

    this.terrainGenerator.populateTrees(
      {
        getBlock: (x, y, z) => this.getBlock(x, y, z),
        setBlock: (x, y, z, blockId, options) =>
          this.setBlock(x, y, z, blockId, options),
        inWorldBounds: (x, y, z) => this.inWorldBounds(x, y, z),
      },
      this.minWorldX,
      this.maxWorldXExclusive,
      this.minWorldZ,
      this.maxWorldZExclusive,
    );
  }

  private applyStoredEdits(): void {
    for (const [key, blockId] of this.storage.load()) {
      const [xRaw, yRaw, zRaw] = key.split(",");
      const x = Number(xRaw);
      const y = Number(yRaw);
      const z = Number(zRaw);

      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        continue;
      }

      this.setBlock(x, y, z, blockId, {
        persist: false,
        markDirty: false,
      });
    }
  }

  private resolveSpawnPosition(): Vector3 {
    const baseSpawn = this.terrainGenerator.createSpawnPosition();
    const baseX = Math.floor(baseSpawn.x);
    const baseZ = Math.floor(baseSpawn.z);

    for (let radius = 0; radius <= 8; radius += 1) {
      for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
        for (let offsetZ = -radius; offsetZ <= radius; offsetZ += 1) {
          const x = baseX + offsetX;
          const z = baseZ + offsetZ;
          const surfaceY = this.getSurfaceHeight(x, z);
          const groundBlock = this.getBlock(x, surfaceY, z);

          if (
            surfaceY < 0 ||
            groundBlock === BlockId.Air ||
            groundBlock === BlockId.Leaves ||
            groundBlock === BlockId.Wood ||
            this.getBlock(x, surfaceY + 1, z) !== BlockId.Air ||
            this.getBlock(x, surfaceY + 2, z) !== BlockId.Air
          ) {
            continue;
          }

          return new Vector3(x + 0.5, surfaceY + 1.001, z + 0.5);
        }
      }
    }

    return baseSpawn;
  }

  private markBlockAndNeighborsDirty(
    chunkX: number,
    chunkZ: number,
    localX: number,
    localZ: number,
  ): void {
    this.chunkManager.markChunkDirty(chunkX, chunkZ);

    if (localX === 0) {
      this.chunkManager.markChunkDirty(chunkX - 1, chunkZ);
    } else if (localX === chunkSizeX - 1) {
      this.chunkManager.markChunkDirty(chunkX + 1, chunkZ);
    }

    if (localZ === 0) {
      this.chunkManager.markChunkDirty(chunkX, chunkZ - 1);
    } else if (localZ === chunkSizeZ - 1) {
      this.chunkManager.markChunkDirty(chunkX, chunkZ + 1);
    }
  }
}
