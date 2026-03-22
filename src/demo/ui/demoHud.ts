import type { ShipTelemetry } from "../physics/shipBuoyancyController";

export class DemoHud {
  private readonly root: HTMLDivElement;
  private readonly speedValue: HTMLElement;
  private readonly draftValue: HTMLElement;
  private readonly rollValue: HTMLElement;
  private readonly pitchValue: HTMLElement;
  private readonly submergedValue: HTMLElement;
  private readonly buoyancyValue: HTMLElement;

  public constructor(container: HTMLElement) {
    this.root = document.createElement("div");
    this.root.className = "demo-overlay";
    this.root.innerHTML = `
      <section class="panel hero-panel">
        <p class="eyebrow">Babylon.js Buoyancy Study</p>
        <h1 class="hero-title">Voxel ship, flat water, real-time buoyancy.</h1>
        <p class="hero-copy">
          Every block contributes mass and displaced volume. The ship settles,
          rolls, pitches, and responds to thrust by summing buoyancy and drag at
          each voxel sample point.
        </p>
      </section>

      <section class="panel metric-panel">
        <div class="metric-grid">
          <div class="metric-row">
            <span class="metric-label">Speed</span>
            <strong class="metric-value" data-field="speed"></strong>
          </div>
          <div class="metric-row">
            <span class="metric-label">Draft</span>
            <strong class="metric-value" data-field="draft"></strong>
          </div>
          <div class="metric-row">
            <span class="metric-label">Roll</span>
            <strong class="metric-value" data-field="roll"></strong>
          </div>
          <div class="metric-row">
            <span class="metric-label">Pitch</span>
            <strong class="metric-value" data-field="pitch"></strong>
          </div>
          <div class="metric-row">
            <span class="metric-label">Submerged</span>
            <strong class="metric-value" data-field="submerged"></strong>
          </div>
          <div class="metric-row">
            <span class="metric-label">Buoyancy</span>
            <strong class="metric-value" data-field="buoyancy"></strong>
          </div>
        </div>
      </section>

      <section class="panel footer-panel">
        <div class="control-list">
          <article class="control-card">
            <span class="control-key">W / S</span>
            <h2 class="control-title">Throttle</h2>
            <p class="control-copy">Push the hull forward or reverse through the water.</p>
          </article>
          <article class="control-card">
            <span class="control-key">A / D</span>
            <h2 class="control-title">Rudder</h2>
            <p class="control-copy">Apply turning force from the stern while the ship is moving.</p>
          </article>
          <article class="control-card">
            <span class="control-key">Shift</span>
            <h2 class="control-title">Boost</h2>
            <p class="control-copy">Briefly increase engine force to exaggerate the water response.</p>
          </article>
          <article class="control-card">
            <span class="control-key">R</span>
            <h2 class="control-title">Reset</h2>
            <p class="control-copy">Return the model to its starting pose if you tip it too far.</p>
          </article>
          <article class="control-card">
            <span class="control-key">Mouse</span>
            <h2 class="control-title">Orbit</h2>
            <p class="control-copy">Drag to orbit the camera and use the wheel to zoom.</p>
          </article>
        </div>
      </section>
    `;

    container.appendChild(this.root);

    this.speedValue = this.getField("speed");
    this.draftValue = this.getField("draft");
    this.rollValue = this.getField("roll");
    this.pitchValue = this.getField("pitch");
    this.submergedValue = this.getField("submerged");
    this.buoyancyValue = this.getField("buoyancy");
  }

  public update(telemetry: ShipTelemetry): void {
    this.speedValue.textContent = `${telemetry.speed.toFixed(2)} u/s`;
    this.draftValue.textContent = `${telemetry.draft.toFixed(2)} u`;
    this.rollValue.textContent = `${telemetry.rollDegrees.toFixed(1)} deg`;
    this.pitchValue.textContent = `${telemetry.pitchDegrees.toFixed(1)} deg`;
    this.submergedValue.textContent = `${telemetry.submergedPercent.toFixed(0)}%`;
    this.buoyancyValue.textContent = `${telemetry.buoyancyBalance.toFixed(2)}x`;
  }

  public dispose(): void {
    this.root.remove();
  }

  private getField(name: string): HTMLElement {
    const element = this.root.querySelector(`[data-field="${name}"]`);

    if (!(element instanceof HTMLElement)) {
      throw new Error(`HUD field "${name}" is missing.`);
    }

    return element;
  }
}
