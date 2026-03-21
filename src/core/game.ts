import type { Scene } from "@babylonjs/core";

import { BlockInteractor } from "../player/blockInteractor";
import { InputController } from "../player/inputController";
import { PlayerController } from "../player/playerController";
import { BlockHighlight } from "../rendering/highlight";
import {
  createGameMaterials,
  disposeGameMaterials,
  type GameMaterials,
} from "../rendering/materials";
import { Hud } from "../ui/hud";
import { WorldManager } from "../world/worldManager";
import { GAME_CONFIG } from "./config";
import { EngineManager } from "./engine";
import { createGameScene } from "./scene";

export class Game {
  private readonly engineManager: EngineManager;
  private readonly scene: Scene;
  private readonly materials: GameMaterials;
  private readonly input: InputController;
  private readonly world: WorldManager;
  private readonly player: PlayerController;
  private readonly highlight: BlockHighlight;
  private readonly blockInteractor: BlockInteractor;
  private readonly hud: Hud;
  private started = false;
  private disposed = false;

  public constructor(root: HTMLElement) {
    this.engineManager = new EngineManager(root);
    this.scene = createGameScene(this.engineManager.engine);
    this.materials = createGameMaterials(this.scene);
    this.world = new WorldManager(this.scene, this.materials.chunkMaterial);
    this.input = new InputController(this.engineManager.canvas);
    this.player = new PlayerController(
      this.scene,
      this.world.getSpawnPosition(),
      this.input,
      this.world,
    );
    this.highlight = new BlockHighlight(this.scene);
    this.blockInteractor = new BlockInteractor(
      this.world,
      this.player,
      this.highlight,
    );
    this.hud = new Hud(root);
  }

  public start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.world.update(this.player.getPosition());

    this.engineManager.engine.runRenderLoop(this.renderFrame);
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.engineManager.engine.stopRenderLoop(this.renderFrame);
    this.hud.dispose();
    this.highlight.dispose();
    this.input.dispose();
    this.world.dispose();
    disposeGameMaterials(this.materials);
    this.scene.dispose();
    this.engineManager.dispose();
  }

  private readonly renderFrame = (): void => {
    const deltaSeconds = Math.min(
      this.engineManager.engine.getDeltaTime() / 1000,
      GAME_CONFIG.rendering.targetFrameClampSeconds,
    );

    this.player.update(deltaSeconds);
    this.world.update(this.player.getPosition());
    this.blockInteractor.updateTarget();

    let worldChanged = false;
    if (this.input.isPointerLocked()) {
      if (this.input.consumeBreakAction()) {
        worldChanged = this.blockInteractor.tryBreakTargetBlock() || worldChanged;
      }

      if (this.input.consumePlaceAction()) {
        worldChanged =
          this.blockInteractor.tryPlaceSelectedBlock(
            this.player.getSelectedBlockId(),
          ) || worldChanged;
      }
    } else {
      this.input.consumeBreakAction();
      this.input.consumePlaceAction();
    }

    if (worldChanged) {
      this.world.update(this.player.getPosition());
    }

    this.hud.update(
      this.player.getSelectedBlockIndex(),
      this.input.isPointerLocked(),
    );

    this.scene.render();
  };
}
