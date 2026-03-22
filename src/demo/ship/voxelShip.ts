import {
  Color3,
  MeshBuilder,
  Quaternion,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

import {
  SHIP_BLUEPRINT,
  SHIP_VOXEL_TYPES,
  type ShipLayerDefinition,
  type ShipVoxelTypeDefinition,
} from "./shipBlueprint";

type ShipSymbol = keyof typeof SHIP_VOXEL_TYPES;

export interface ShipVoxelBlock {
  readonly type: ShipVoxelTypeDefinition;
  readonly localCenter: Vector3;
  readonly volume: number;
  readonly mass: number;
}

interface RawShipVoxelBlock {
  readonly type: ShipVoxelTypeDefinition;
  readonly localCenter: Vector3;
}

export class VoxelShip {
  public readonly root: TransformNode;
  public readonly halfBlockSize: number;
  public readonly blocks: readonly ShipVoxelBlock[];
  public readonly mass: number;
  public readonly totalVolume: number;
  public readonly inverseInertiaLocal: Vector3;
  public readonly propellerLocalPoint: Vector3;
  public readonly rudderLocalPoint: Vector3;
  public readonly topOffset: number;
  public readonly bottomOffset: number;

  private readonly materials: StandardMaterial[];

  public constructor(scene: Scene, public readonly blockSize: number) {
    this.root = new TransformNode("voxel-ship-root", scene);
    this.root.rotationQuaternion = Quaternion.Identity();
    this.halfBlockSize = blockSize / 2;

    const rawBlocks = this.createRawBlocks(blockSize);
    const centeredBlocks = this.centerBlocksByMass(rawBlocks);
    this.blocks = centeredBlocks;
    this.totalVolume = centeredBlocks.length * Math.pow(blockSize, 3);
    this.mass = centeredBlocks.reduce((sum, block) => sum + block.mass, 0);
    this.inverseInertiaLocal = this.computeInverseInertia(centeredBlocks);
    this.bottomOffset =
      Math.min(...centeredBlocks.map((block) => block.localCenter.y)) -
      this.halfBlockSize;
    this.topOffset =
      Math.max(...centeredBlocks.map((block) => block.localCenter.y)) +
      this.halfBlockSize;

    const sternOffset =
      Math.min(...centeredBlocks.map((block) => block.localCenter.z)) -
      this.halfBlockSize;
    this.propellerLocalPoint = new Vector3(
      0,
      this.bottomOffset + this.blockSize * 0.82,
      sternOffset - this.blockSize * 0.3,
    );
    this.rudderLocalPoint = new Vector3(
      0,
      0,
      sternOffset - this.blockSize * 0.1,
    );

    this.materials = this.createBlockMeshes(scene, centeredBlocks);
  }

  public setPose(position: Vector3, orientation: Quaternion): void {
    this.root.position.copyFrom(position);

    if (!(this.root.rotationQuaternion instanceof Quaternion)) {
      this.root.rotationQuaternion = Quaternion.Identity();
    }

    this.root.rotationQuaternion.copyFrom(orientation);
  }

  public dispose(): void {
    this.root.dispose();
    for (const material of this.materials) {
      material.dispose();
    }
  }

  private createRawBlocks(blockSize: number): RawShipVoxelBlock[] {
    const depth = SHIP_BLUEPRINT[0]?.rows.length ?? 0;
    const width = SHIP_BLUEPRINT[0]?.rows[0]?.length ?? 0;
    const blocks: RawShipVoxelBlock[] = [];

    SHIP_BLUEPRINT.forEach((layer, layerIndex) => {
      this.validateLayer(layer, width, depth);

      layer.rows.forEach((row, rowIndex) => {
        for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
          const symbol = row[columnIndex] as "." | ShipSymbol;

          if (symbol === ".") {
            continue;
          }

          const type = SHIP_VOXEL_TYPES[symbol];
          const x = (columnIndex - (width - 1) / 2) * blockSize;
          const y = layerIndex * blockSize;
          const z = (rowIndex - (depth - 1) / 2) * blockSize;

          blocks.push({
            type,
            localCenter: new Vector3(x, y, z),
          });
        }
      });
    });

    return blocks;
  }

  private validateLayer(
    layer: ShipLayerDefinition,
    expectedWidth: number,
    expectedDepth: number,
  ): void {
    if (layer.rows.length !== expectedDepth) {
      throw new Error(`Layer "${layer.name}" depth does not match the blueprint.`);
    }

    layer.rows.forEach((row) => {
      if (row.length !== expectedWidth) {
        throw new Error(`Layer "${layer.name}" width does not match the blueprint.`);
      }
    });
  }

  private centerBlocksByMass(
    rawBlocks: readonly RawShipVoxelBlock[],
  ): ShipVoxelBlock[] {
    const volume = Math.pow(this.blockSize, 3);
    const weightedCenter = rawBlocks.reduce(
      (sum, block) => sum.add(block.localCenter.scale(block.type.density * volume)),
      Vector3.Zero(),
    );
    const totalMass = rawBlocks.reduce(
      (sum, block) => sum + block.type.density * volume,
      0,
    );
    const centerOfMass =
      totalMass > 0 ? weightedCenter.scale(1 / totalMass) : Vector3.Zero();

    return rawBlocks.map((block) => ({
      type: block.type,
      localCenter: block.localCenter.subtract(centerOfMass),
      volume,
      mass: block.type.density * volume,
    }));
  }

  private computeInverseInertia(blocks: readonly ShipVoxelBlock[]): Vector3 {
    const blockInertia = Math.pow(this.blockSize, 2) / 6;
    let inertiaX = 0;
    let inertiaY = 0;
    let inertiaZ = 0;

    for (const block of blocks) {
      const { x, y, z } = block.localCenter;
      inertiaX += block.mass * (y * y + z * z + blockInertia);
      inertiaY += block.mass * (x * x + z * z + blockInertia);
      inertiaZ += block.mass * (x * x + y * y + blockInertia);
    }

    return new Vector3(
      inertiaX > 0 ? 1 / inertiaX : 0,
      inertiaY > 0 ? 1 / inertiaY : 0,
      inertiaZ > 0 ? 1 / inertiaZ : 0,
    );
  }

  private createBlockMeshes(
    scene: Scene,
    blocks: readonly ShipVoxelBlock[],
  ): StandardMaterial[] {
    const materials = new Map<string, StandardMaterial>();

    blocks.forEach((block, index) => {
      let material = materials.get(block.type.id);
      if (!(material instanceof StandardMaterial)) {
        material = new StandardMaterial(`ship-material-${block.type.id}`, scene);
        material.diffuseColor = Color3.FromHexString(block.type.colorHex);
        material.emissiveColor = material.diffuseColor.scale(0.08);
        material.specularColor = Color3.FromHexString("#eefcff").scale(0.08);
        materials.set(block.type.id, material);
      }

      const box = MeshBuilder.CreateBox(
        `ship-block-${index}`,
        {
          size: this.blockSize * 0.96,
        },
        scene,
      );
      box.position.copyFrom(block.localCenter);
      box.parent = this.root;
      box.material = material;
      box.isPickable = false;
      box.receiveShadows = false;
      box.alwaysSelectAsActiveMesh = true;
    });

    return [...materials.values()];
  }
}
