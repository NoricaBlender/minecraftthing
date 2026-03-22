import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
} from "@babylonjs/core";

import { DEMO_CONFIG } from "../config";

export class WaterSurface {
  public readonly level = DEMO_CONFIG.water.level;

  private readonly seabed: Mesh;
  private readonly waterMesh: Mesh;
  private readonly seabedMaterial: StandardMaterial;
  private readonly waterMaterial: StandardMaterial;

  public constructor(scene: Scene) {
    this.seabed = MeshBuilder.CreateGround(
      "seabed",
      {
        width: DEMO_CONFIG.world.waterSize,
        height: DEMO_CONFIG.world.waterSize,
        subdivisions: 1,
      },
      scene,
    );
    this.seabed.position.y = this.level - DEMO_CONFIG.world.seabedDepth;

    this.seabedMaterial = new StandardMaterial("seabed-material", scene);
    this.seabedMaterial.diffuseColor = Color3.FromHexString("#103847");
    this.seabedMaterial.emissiveColor = Color3.FromHexString("#0c2b35").scale(
      0.5,
    );
    this.seabed.material = this.seabedMaterial;

    this.waterMesh = MeshBuilder.CreateGround(
      "water-plane",
      {
        width: DEMO_CONFIG.world.waterSize,
        height: DEMO_CONFIG.world.waterSize,
        subdivisions: 2,
      },
      scene,
    );
    this.waterMesh.position.y = this.level;

    this.waterMaterial = new StandardMaterial("water-material", scene);
    this.waterMaterial.diffuseColor = Color3.FromHexString("#6bd4e4");
    this.waterMaterial.emissiveColor = Color3.FromHexString("#4ab1c2").scale(
      0.3,
    );
    this.waterMaterial.alpha = 0.75;
    this.waterMaterial.specularColor = Color3.FromHexString("#f1feff").scale(
      0.2,
    );
    this.waterMesh.material = this.waterMaterial;
  }

  public heightAt(_x: number, _z: number): number {
    return this.level;
  }

  public dispose(): void {
    this.waterMaterial.dispose();
    this.seabedMaterial.dispose();
    this.waterMesh.dispose();
    this.seabed.dispose();
  }
}
