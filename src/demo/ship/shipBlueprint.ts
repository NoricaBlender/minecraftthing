export interface ShipVoxelTypeDefinition {
  readonly id: string;
  readonly label: string;
  readonly density: number;
  readonly colorHex: string;
  readonly waterDragMultiplier: number;
  readonly keelInfluence: number;
}

export interface ShipLayerDefinition {
  readonly name: string;
  readonly rows: readonly string[];
}

export const SHIP_VOXEL_TYPES = {
  B: {
    id: "ballast",
    label: "Ballast",
    density: 0.82,
    colorHex: "#8c2f2b",
    waterDragMultiplier: 1.2,
    keelInfluence: 1.55,
  },
  K: {
    id: "keel",
    label: "Keel",
    density: 0.58,
    colorHex: "#b13a35",
    waterDragMultiplier: 1.08,
    keelInfluence: 1.35,
  },
  H: {
    id: "hull",
    label: "Hull",
    density: 0.4,
    colorHex: "#d1c189",
    waterDragMultiplier: 1,
    keelInfluence: 1,
  },
  D: {
    id: "deck",
    label: "Deck",
    density: 0.28,
    colorHex: "#f0dfab",
    waterDragMultiplier: 0.92,
    keelInfluence: 0.88,
  },
  C: {
    id: "cabin",
    label: "Cabin",
    density: 0.2,
    colorHex: "#4e545d",
    waterDragMultiplier: 0.84,
    keelInfluence: 0.8,
  },
  M: {
    id: "mast",
    label: "Mast",
    density: 0.13,
    colorHex: "#6f7682",
    waterDragMultiplier: 0.72,
    keelInfluence: 0.72,
  },
} as const;

export const SHIP_BLUEPRINT: readonly ShipLayerDefinition[] = [
  {
    name: "keel",
    rows: [
      "...B...",
      "..BBB..",
      ".BKKKB.",
      ".BKKKB.",
      "BKKKKKB",
      "BKKKKKB",
      "BKKKKKB",
      ".BKKKB.",
      ".BKKKB.",
      "..BBB..",
      "...B...",
    ],
  },
  {
    name: "lower-hull",
    rows: [
      "..HHH..",
      ".HHHHH.",
      "HHHHHHH",
      "HHHHHHH",
      "HHHHHHH",
      "HHHHHHH",
      "HHHHHHH",
      "HHHHHHH",
      "HHHHHHH",
      ".HHHHH.",
      "..HHH..",
    ],
  },
  {
    name: "deck",
    rows: [
      "...D...",
      "..DDD..",
      ".DDDDD.",
      "DDDDDDD",
      "DDDDDDD",
      "DDDDDDD",
      "DDDDDDD",
      "DDDDDDD",
      ".DDDDD.",
      "..DDD..",
      "...D...",
    ],
  },
  {
    name: "cabin",
    rows: [
      ".......",
      "...C...",
      "..CCC..",
      "..CCC..",
      ".CCCCC.",
      ".CCCCC.",
      ".CCCCC.",
      "..CCC..",
      "..CCC..",
      "...C...",
      ".......",
    ],
  },
  {
    name: "mast",
    rows: [
      ".......",
      ".......",
      "...M...",
      "...M...",
      "...M...",
      "..MMM..",
      "...M...",
      "...M...",
      "...M...",
      ".......",
      ".......",
    ],
  },
] as const;
