import {
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Scene,
  Vector3,
} from "@babylonjs/core";

import { GAME_CONFIG } from "./config";

export function createGameScene(engine: Engine): Scene {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(...GAME_CONFIG.rendering.skyColor);

  const hemiLight = new HemisphericLight(
    "hemi-light",
    new Vector3(0.25, 1, 0.2),
    scene,
  );
  hemiLight.intensity = 0.85;

  const directionalLight = new DirectionalLight(
    "sun-light",
    new Vector3(-0.5, -1, 0.35),
    scene,
  );
  directionalLight.position = new Vector3(32, 64, -24);
  directionalLight.intensity = 0.7;

  return scene;
}
