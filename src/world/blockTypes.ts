export enum BlockId {
  Air = 0,
  Grass = 1,
  Dirt = 2,
  Stone = 3,
  Sand = 4,
  Wood = 5,
  Leaves = 6,
}

export type FaceColorRole = "top" | "bottom" | "side";

type ColorTuple = readonly [number, number, number];

interface BlockDefinition {
  id: BlockId;
  name: string;
  solid: boolean;
  opaque: boolean;
  breakable: boolean;
  colors: {
    top: ColorTuple;
    bottom: ColorTuple;
    side: ColorTuple;
  };
}

const AIR_COLORS: ColorTuple = [0, 0, 0];

const BLOCK_DEFINITIONS: Record<BlockId, BlockDefinition> = {
  [BlockId.Air]: {
    id: BlockId.Air,
    name: "Air",
    solid: false,
    opaque: false,
    breakable: false,
    colors: {
      top: AIR_COLORS,
      bottom: AIR_COLORS,
      side: AIR_COLORS,
    },
  },
  [BlockId.Grass]: {
    id: BlockId.Grass,
    name: "Grass",
    solid: true,
    opaque: true,
    breakable: true,
    colors: {
      top: [0.32, 0.67, 0.21],
      bottom: [0.45, 0.31, 0.19],
      side: [0.39, 0.52, 0.18],
    },
  },
  [BlockId.Dirt]: {
    id: BlockId.Dirt,
    name: "Dirt",
    solid: true,
    opaque: true,
    breakable: true,
    colors: {
      top: [0.47, 0.32, 0.18],
      bottom: [0.39, 0.24, 0.12],
      side: [0.45, 0.29, 0.16],
    },
  },
  [BlockId.Stone]: {
    id: BlockId.Stone,
    name: "Stone",
    solid: true,
    opaque: true,
    breakable: true,
    colors: {
      top: [0.53, 0.55, 0.58],
      bottom: [0.4, 0.42, 0.45],
      side: [0.48, 0.5, 0.53],
    },
  },
  [BlockId.Sand]: {
    id: BlockId.Sand,
    name: "Sand",
    solid: true,
    opaque: true,
    breakable: true,
    colors: {
      top: [0.84, 0.78, 0.55],
      bottom: [0.72, 0.66, 0.43],
      side: [0.79, 0.73, 0.5],
    },
  },
  [BlockId.Wood]: {
    id: BlockId.Wood,
    name: "Wood",
    solid: true,
    opaque: true,
    breakable: true,
    colors: {
      top: [0.58, 0.4, 0.22],
      bottom: [0.48, 0.31, 0.17],
      side: [0.51, 0.34, 0.18],
    },
  },
  [BlockId.Leaves]: {
    id: BlockId.Leaves,
    name: "Leaves",
    solid: true,
    opaque: true,
    breakable: true,
    colors: {
      top: [0.28, 0.58, 0.22],
      bottom: [0.2, 0.42, 0.16],
      side: [0.23, 0.49, 0.19],
    },
  },
};

export function getBlockDefinition(blockId: BlockId): BlockDefinition {
  return BLOCK_DEFINITIONS[blockId] ?? BLOCK_DEFINITIONS[BlockId.Air];
}

export function getBlockName(blockId: BlockId): string {
  return getBlockDefinition(blockId).name;
}

export function getBlockFaceColor(
  blockId: BlockId,
  role: FaceColorRole,
): ColorTuple {
  return getBlockDefinition(blockId).colors[role];
}

export function isSolidBlock(blockId: BlockId): boolean {
  return getBlockDefinition(blockId).solid;
}

export function isOpaqueBlock(blockId: BlockId): boolean {
  return getBlockDefinition(blockId).opaque;
}

export function isBreakableBlock(blockId: BlockId): boolean {
  return getBlockDefinition(blockId).breakable;
}
