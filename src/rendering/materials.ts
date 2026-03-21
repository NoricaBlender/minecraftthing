import { Color3, Scene, StandardMaterial } from "@babylonjs/core";

export interface GameMaterials {
  chunkMaterial: StandardMaterial;
}

export function createGameMaterials(scene: Scene): GameMaterials {
  const chunkMaterial = new StandardMaterial("chunk-material", scene);
  chunkMaterial.diffuseColor = Color3.White();
  chunkMaterial.ambientColor = Color3.White();
  chunkMaterial.specularColor = Color3.Black();

  return {
    chunkMaterial,
  };
}

export function disposeGameMaterials(materials: GameMaterials): void {
  materials.chunkMaterial.dispose();
}
