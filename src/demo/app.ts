import { Vector3 } from "@babylonjs/core";

import { EngineManager } from "../core/engine";
import { DEMO_CONFIG } from "./config";
import { ShipInputController } from "./controls/shipInput";
import { createDemoScene } from "./environment/sceneSetup";
import { WaterSurface } from "./environment/waterSurface";
import { ShipBuoyancyController } from "./physics/shipBuoyancyController";
import { VoxelShip } from "./ship/voxelShip";
import { DemoHud } from "./ui/demoHud";

export class BuoyancyDemoApp {
  private readonly engineManager: EngineManager;
  private readonly sceneContext: ReturnType<typeof createDemoScene>;
  private readonly inputController: ShipInputController;
  private readonly hud: DemoHud;
  private readonly waterSurface: WaterSurface;
  private readonly ship: VoxelShip;
  private readonly buoyancyController: ShipBuoyancyController;

  private started = false;
  private disposed = false;

  public constructor(root: HTMLElement) {
    this.engineManager = new EngineManager(root);
    this.sceneContext = createDemoScene(
      this.engineManager.engine,
      this.engineManager.canvas,
    );

    this.inputController = new ShipInputController();
    this.hud = new DemoHud(root);
    this.waterSurface = new WaterSurface(this.sceneContext.scene);
    this.ship = new VoxelShip(this.sceneContext.scene, DEMO_CONFIG.ship.blockSize);
    this.buoyancyController = new ShipBuoyancyController(
      this.ship,
      this.waterSurface,
    );
  }

  public start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.engineManager.engine.runRenderLoop(this.renderFrame);
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.engineManager.engine.stopRenderLoop(this.renderFrame);
    this.hud.dispose();
    this.inputController.dispose();
    this.ship.dispose();
    this.waterSurface.dispose();
    this.sceneContext.scene.dispose();
    this.engineManager.dispose();
  }

  private readonly renderFrame = (): void => {
    const deltaSeconds = Math.min(
      this.engineManager.engine.getDeltaTime() / 1000,
      DEMO_CONFIG.physics.maxDeltaSeconds,
    );

    if (this.inputController.consumeResetRequest()) {
      this.buoyancyController.reset();
    }

    this.buoyancyController.update(deltaSeconds, this.inputController.getState());
    this.hud.update(this.buoyancyController.getTelemetry());

    const shipPosition = this.buoyancyController.getPosition();
    const followTarget = Vector3.Lerp(
      this.sceneContext.camera.target,
      shipPosition.add(new Vector3(0, 0.8, 0)),
      DEMO_CONFIG.camera.followLerp,
    );
    this.sceneContext.camera.setTarget(followTarget);

    this.sceneContext.scene.render();
  };
}
