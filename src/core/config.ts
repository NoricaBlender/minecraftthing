import { BlockId } from "../world/blockTypes";

const gravity = 24;
const jumpHeight = 1.25;

export const GAME_CONFIG = {
  world: {
    seed: 28101995,
    chunkSizeX: 16,
    chunkSizeY: 64,
    chunkSizeZ: 16,
    renderDistance: 4,
    worldChunkRadius: 6,
    seaLevel: 24,
    baseTerrainHeight: 22,
    terrainAmplitude: 16,
    storageKeyPrefix: "babylon-voxel-sandbox-world",
  },
  player: {
    walkSpeed: 4.5,
    sprintSpeed: 6.5,
    gravity,
    jumpHeight,
    jumpVelocity: Math.sqrt(2 * gravity * jumpHeight),
    width: 0.6,
    height: 1.8,
    eyeHeight: 1.62,
    reachDistance: 5,
    mouseSensitivity: 0.0022,
    maxPitch: Math.PI * 0.495,
    collisionPadding: 0.001,
  },
  rendering: {
    targetFrameClampSeconds: 0.05,
    skyColor: [0.52, 0.73, 0.91, 1] as const,
  },
  ui: {
    hotbarBlocks: [
      BlockId.Grass,
      BlockId.Dirt,
      BlockId.Stone,
      BlockId.Sand,
      BlockId.Wood,
      BlockId.Leaves,
    ] as const,
  },
} as const;

export type HotbarBlockId = (typeof GAME_CONFIG.ui.hotbarBlocks)[number];
