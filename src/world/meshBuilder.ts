import { GAME_CONFIG } from "../core/config";
import { BlockId, getBlockFaceColor, isOpaqueBlock } from "./blockTypes";
import type { Chunk } from "./chunk";

interface FaceDefinition {
  neighborOffset: readonly [number, number, number];
  normal: readonly [number, number, number];
  corners: ReadonlyArray<readonly [number, number, number]>;
  colorRole: "top" | "bottom" | "side";
  shade: number;
}

export interface ChunkMeshData {
  positions: number[];
  indices: number[];
  normals: number[];
  colors: number[];
}

const FACE_DEFINITIONS: readonly FaceDefinition[] = [
  {
    neighborOffset: [0, 1, 0],
    normal: [0, 1, 0],
    corners: [
      [0, 1, 0],
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
    ],
    colorRole: "top",
    shade: 1,
  },
  {
    neighborOffset: [0, -1, 0],
    normal: [0, -1, 0],
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
    colorRole: "bottom",
    shade: 0.72,
  },
  {
    neighborOffset: [0, 0, -1],
    normal: [0, 0, -1],
    corners: [
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
    colorRole: "side",
    shade: 0.88,
  },
  {
    neighborOffset: [0, 0, 1],
    normal: [0, 0, 1],
    corners: [
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
      [0, 0, 1],
    ],
    colorRole: "side",
    shade: 0.88,
  },
  {
    neighborOffset: [-1, 0, 0],
    normal: [-1, 0, 0],
    corners: [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
      [0, 0, 0],
    ],
    colorRole: "side",
    shade: 0.8,
  },
  {
    neighborOffset: [1, 0, 0],
    normal: [1, 0, 0],
    corners: [
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, 1],
    ],
    colorRole: "side",
    shade: 0.8,
  },
] as const;

const { chunkSizeX, chunkSizeY, chunkSizeZ } = GAME_CONFIG.world;

export class ChunkMeshBuilder {
  public build(
    chunk: Chunk,
    getBlockAtWorld: (x: number, y: number, z: number) => BlockId,
  ): ChunkMeshData | null {
    const positions: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    let vertexOffset = 0;

    for (let y = 0; y < chunkSizeY; y += 1) {
      for (let localZ = 0; localZ < chunkSizeZ; localZ += 1) {
        for (let localX = 0; localX < chunkSizeX; localX += 1) {
          const blockId = chunk.getBlock(localX, y, localZ);
          if (blockId === BlockId.Air) {
            continue;
          }

          const worldX = chunk.worldOriginX + localX;
          const worldZ = chunk.worldOriginZ + localZ;

          for (const face of FACE_DEFINITIONS) {
            const neighbor = getBlockAtWorld(
              worldX + face.neighborOffset[0],
              y + face.neighborOffset[1],
              worldZ + face.neighborOffset[2],
            );

            if (neighbor !== BlockId.Air && isOpaqueBlock(neighbor)) {
              continue;
            }

            const baseColor = getBlockFaceColor(blockId, face.colorRole);
            const shadedColor = [
              baseColor[0] * face.shade,
              baseColor[1] * face.shade,
              baseColor[2] * face.shade,
            ] as const;

            for (const corner of face.corners) {
              positions.push(
                worldX + corner[0],
                y + corner[1],
                worldZ + corner[2],
              );
              normals.push(face.normal[0], face.normal[1], face.normal[2]);
              colors.push(
                shadedColor[0],
                shadedColor[1],
                shadedColor[2],
                1,
              );
            }

            indices.push(
              vertexOffset,
              vertexOffset + 1,
              vertexOffset + 2,
              vertexOffset,
              vertexOffset + 2,
              vertexOffset + 3,
            );
            vertexOffset += 4;
          }
        }
      }
    }

    if (positions.length === 0) {
      return null;
    }

    return {
      positions,
      indices,
      normals,
      colors,
    };
  }
}
