import { Vector3 } from "@babylonjs/core";

import { GAME_CONFIG } from "../core/config";
import { clamp } from "../utils/math";
import { FractalNoise2D, hash2D } from "../utils/noise";
import { BlockId } from "./blockTypes";
import type { Chunk } from "./chunk";

interface TerrainWorldAccess {
  getBlock(x: number, y: number, z: number): BlockId;
  setBlock(
    x: number,
    y: number,
    z: number,
    blockId: BlockId,
    options?: {
      persist?: boolean;
      markDirty?: boolean;
    },
  ): boolean;
  inWorldBounds(x: number, y: number, z: number): boolean;
}

const { baseTerrainHeight, chunkSizeY, seaLevel, terrainAmplitude } =
  GAME_CONFIG.world;

export class TerrainGenerator {
  private readonly elevationNoise: FractalNoise2D;
  private readonly detailNoise: FractalNoise2D;
  private readonly moistureNoise: FractalNoise2D;

  public constructor(private readonly seed: number) {
    this.elevationNoise = new FractalNoise2D(seed ^ 0x13a5d1);
    this.detailNoise = new FractalNoise2D(seed ^ 0x91bc1f);
    this.moistureNoise = new FractalNoise2D(seed ^ 0x51bd47);
  }

  public generateBaseTerrain(chunk: Chunk): void {
    for (let localX = 0; localX < GAME_CONFIG.world.chunkSizeX; localX += 1) {
      for (
        let localZ = 0;
        localZ < GAME_CONFIG.world.chunkSizeZ;
        localZ += 1
      ) {
        const worldX = chunk.worldOriginX + localX;
        const worldZ = chunk.worldOriginZ + localZ;
        const surfaceHeight = this.getSurfaceHeight(worldX, worldZ);
        const useSand =
          surfaceHeight <= seaLevel + 1 && this.getSlope(worldX, worldZ) <= 2;

        for (let y = 0; y <= surfaceHeight; y += 1) {
          let blockId = BlockId.Stone;

          if (useSand && y >= surfaceHeight - 3) {
            blockId = BlockId.Sand;
          } else if (y === surfaceHeight) {
            blockId = BlockId.Grass;
          } else if (y >= surfaceHeight - 3) {
            blockId = BlockId.Dirt;
          }

          chunk.setBlock(localX, y, localZ, blockId);
        }
      }
    }

    chunk.isGenerated = true;
    chunk.isDirty = true;
  }

  public populateTrees(
    world: TerrainWorldAccess,
    minWorldX: number,
    maxWorldX: number,
    minWorldZ: number,
    maxWorldZ: number,
  ): void {
    for (let x = minWorldX + 2; x < maxWorldX - 2; x += 1) {
      for (let z = minWorldZ + 2; z < maxWorldZ - 2; z += 1) {
        const surfaceHeight = this.getSurfaceHeight(x, z);
        const surfaceBlock = world.getBlock(x, surfaceHeight, z);

        if (surfaceBlock !== BlockId.Grass || surfaceHeight <= seaLevel + 1) {
          continue;
        }

        if (this.getSlope(x, z) > 2) {
          continue;
        }

        const chance = hash2D(this.seed ^ 0x73241, x, z);
        if (chance < 0.985) {
          continue;
        }

        const trunkHeight = chance > 0.996 ? 5 : 4;
        const trunkTop = surfaceHeight + trunkHeight;

        if (!world.inWorldBounds(x, trunkTop + 2, z)) {
          continue;
        }

        this.placeTree(world, x, surfaceHeight + 1, z, trunkHeight);
      }
    }
  }

  public createSpawnPosition(): Vector3 {
    for (let radius = 0; radius <= 8; radius += 1) {
      for (let x = -radius; x <= radius; x += 1) {
        for (let z = -radius; z <= radius; z += 1) {
          const surfaceHeight = this.getSurfaceHeight(x, z);
          if (surfaceHeight <= 0) {
            continue;
          }

          return new Vector3(x + 0.5, surfaceHeight + 1.001, z + 0.5);
        }
      }
    }

    return new Vector3(0.5, seaLevel + 8, 0.5);
  }

  public getSurfaceHeight(x: number, z: number): number {
    const broad = this.elevationNoise.sample(x * 0.045, z * 0.045, 4, 0.5, 2);
    const detail = this.detailNoise.sample(x * 0.1, z * 0.1, 3, 0.55, 2.2);
    const moisture = this.moistureNoise.sample(x * 0.022, z * 0.022, 2, 0.5, 2);
    const shapedBroad = (broad - 0.5) * terrainAmplitude;
    const shapedDetail = (detail - 0.5) * 6;
    const moistureLift = (moisture - 0.45) * 4;
    const height = baseTerrainHeight + shapedBroad + shapedDetail + moistureLift;

    return Math.round(clamp(height, 6, chunkSizeY - 8));
  }

  private placeTree(
    world: TerrainWorldAccess,
    rootX: number,
    baseY: number,
    rootZ: number,
    trunkHeight: number,
  ): void {
    for (let y = 0; y < trunkHeight; y += 1) {
      world.setBlock(rootX, baseY + y, rootZ, BlockId.Wood, {
        persist: false,
        markDirty: false,
      });
    }

    const canopyBaseY = baseY + trunkHeight - 2;

    for (let offsetY = 0; offsetY <= 3; offsetY += 1) {
      const radius = offsetY === 3 ? 1 : 2;

      for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
        for (let offsetZ = -radius; offsetZ <= radius; offsetZ += 1) {
          const distance = Math.abs(offsetX) + Math.abs(offsetZ);
          if (distance > radius + 1) {
            continue;
          }

          const x = rootX + offsetX;
          const y = canopyBaseY + offsetY;
          const z = rootZ + offsetZ;

          if (!world.inWorldBounds(x, y, z)) {
            continue;
          }

          if (world.getBlock(x, y, z) !== BlockId.Air) {
            continue;
          }

          world.setBlock(x, y, z, BlockId.Leaves, {
            persist: false,
            markDirty: false,
          });
        }
      }
    }
  }

  private getSlope(x: number, z: number): number {
    const center = this.getSurfaceHeight(x, z);
    const east = this.getSurfaceHeight(x + 1, z);
    const west = this.getSurfaceHeight(x - 1, z);
    const north = this.getSurfaceHeight(x, z - 1);
    const south = this.getSurfaceHeight(x, z + 1);

    return Math.max(
      Math.abs(center - east),
      Math.abs(center - west),
      Math.abs(center - north),
      Math.abs(center - south),
    );
  }
}
