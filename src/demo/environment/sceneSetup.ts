import {
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Scene,
  Vector3,
} from "@babylonjs/core";

import { DEMO_CONFIG } from "../config";

export interface DemoSceneContext {
  readonly scene: Scene;
  readonly camera: ArcRotateCamera;
}

export function createDemoScene(
  engine: Engine,
  canvas: HTMLCanvasElement,
): DemoSceneContext {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.63, 0.89, 0.94, 1);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.012;
  scene.fogColor = new Color3(0.58, 0.84, 0.88);
  scene.ambientColor = new Color3(0.14, 0.2, 0.22);
  scene.imageProcessingConfiguration.exposure = 1.04;
  scene.imageProcessingConfiguration.contrast = 1.08;

  const camera = new ArcRotateCamera(
    "demo-camera",
    DEMO_CONFIG.camera.alpha,
    DEMO_CONFIG.camera.beta,
    DEMO_CONFIG.camera.radius,
    new Vector3(0, 1.4, 0),
    scene,
  );
  camera.lowerRadiusLimit = 12;
  camera.upperRadiusLimit = 34;
  camera.lowerBetaLimit = 0.72;
  camera.upperBetaLimit = 1.42;
  camera.wheelDeltaPercentage = 0.015;
  camera.panningSensibility = 0;
  camera.attachControl(canvas, true);

  const skyLight = new HemisphericLight(
    "sky-light",
    new Vector3(0.15, 1, -0.05),
    scene,
  );
  skyLight.intensity = 1.05;
  skyLight.groundColor = new Color3(0.05, 0.1, 0.12);

  const sunLight = new DirectionalLight(
    "sun-light",
    new Vector3(-0.25, -1, 0.18),
    scene,
  );
  sunLight.position = new Vector3(18, 28, -14);
  sunLight.intensity = 1.15;

  return { scene, camera };
}
