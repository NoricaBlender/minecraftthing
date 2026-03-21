import { Color3, MeshBuilder, Scene, StandardMaterial } from "@babylonjs/core";

export class BlockHighlight {
  private readonly material: StandardMaterial;
  private readonly mesh;

  public constructor(scene: Scene) {
    this.material = new StandardMaterial("block-highlight-material", scene);
    this.material.disableLighting = true;
    this.material.emissiveColor = new Color3(1, 1, 1);
    this.material.alpha = 0.85;
    this.material.wireframe = true;
    this.material.zOffset = -2;

    this.mesh = MeshBuilder.CreateBox("block-highlight", { size: 1.02 }, scene);
    this.mesh.material = this.material;
    this.mesh.isPickable = false;
    this.mesh.setEnabled(false);
  }

  public show(blockX: number, blockY: number, blockZ: number): void {
    this.mesh.position.set(blockX + 0.5, blockY + 0.5, blockZ + 0.5);
    this.mesh.setEnabled(true);
  }

  public hide(): void {
    this.mesh.setEnabled(false);
  }

  public dispose(): void {
    this.mesh.dispose();
    this.material.dispose();
  }
}
