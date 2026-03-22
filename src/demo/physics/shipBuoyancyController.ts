import { Matrix, Quaternion, Scalar, Vector3 } from "@babylonjs/core";

import { DEMO_CONFIG } from "../config";
import type { ShipControlState } from "../controls/shipInput";
import { WaterSurface } from "../environment/waterSurface";
import { VoxelShip } from "../ship/voxelShip";

export interface ShipTelemetry {
  readonly speed: number;
  readonly draft: number;
  readonly rollDegrees: number;
  readonly pitchDegrees: number;
  readonly submergedPercent: number;
  readonly buoyancyBalance: number;
}

export class ShipBuoyancyController {
  private position = Vector3.Zero();
  private orientation = Quaternion.Identity();
  private linearVelocity = Vector3.Zero();
  private angularVelocity = Vector3.Zero();
  private telemetry: ShipTelemetry = {
    speed: 0,
    draft: 0,
    rollDegrees: 0,
    pitchDegrees: 0,
    submergedPercent: 0,
    buoyancyBalance: 0,
  };

  public constructor(
    private readonly ship: VoxelShip,
    private readonly waterSurface: WaterSurface,
  ) {
    this.reset();
  }

  public update(deltaSeconds: number, controlState: ShipControlState): void {
    const clampedDelta = Math.min(
      deltaSeconds,
      DEMO_CONFIG.physics.maxDeltaSeconds,
    );

    const totalForce = new Vector3(
      0,
      -this.ship.mass * DEMO_CONFIG.physics.gravity,
      0,
    );
    const totalTorque = Vector3.Zero();
    const worldMatrix = Matrix.Compose(
      Vector3.One(),
      this.orientation,
      this.position,
    );

    const forward = Vector3.TransformNormal(Vector3.Forward(), worldMatrix);
    forward.normalize();

    let submergedVolume = 0;
    let accumulatedBuoyancyForce = 0;

    for (const block of this.ship.blocks) {
      const worldCenter = Vector3.TransformCoordinates(
        block.localCenter,
        worldMatrix,
      );
      const bottom = worldCenter.y - this.ship.halfBlockSize;
      const top = worldCenter.y + this.ship.halfBlockSize;
      const waterHeight = this.waterSurface.heightAt(worldCenter.x, worldCenter.z);
      const submergedFraction = Scalar.Clamp(
        (waterHeight - bottom) / (top - bottom),
        0,
        1,
      );

      if (submergedFraction <= 0) {
        continue;
      }

      submergedVolume += block.volume * submergedFraction;

      const leverArm = worldCenter.subtract(this.position);
      const pointVelocity = this.linearVelocity.add(
        Vector3.Cross(this.angularVelocity, leverArm),
      );

      const buoyancyMagnitude =
        DEMO_CONFIG.water.density *
        DEMO_CONFIG.physics.gravity *
        block.volume *
        submergedFraction;
      const buoyancyForce = Vector3.Up().scale(buoyancyMagnitude);
      const linearDrag = pointVelocity.scale(
        -DEMO_CONFIG.water.linearDrag *
          block.type.waterDragMultiplier *
          submergedFraction,
      );

      const lateralVelocity = pointVelocity.subtract(
        forward.scale(Vector3.Dot(pointVelocity, forward)),
      );
      const lateralGrip = lateralVelocity.scale(
        -DEMO_CONFIG.water.lateralGrip *
          block.type.keelInfluence *
          submergedFraction,
      );

      const pointForce = buoyancyForce.add(linearDrag).add(lateralGrip);
      accumulatedBuoyancyForce += buoyancyMagnitude;
      this.applyForceAtPoint(pointForce, worldCenter, totalForce, totalTorque);
    }

    const throttleForce =
      controlState.throttle >= 0
        ? DEMO_CONFIG.propulsion.forwardForce
        : DEMO_CONFIG.propulsion.reverseForce;
    const boostMultiplier = controlState.boost
      ? DEMO_CONFIG.propulsion.boostMultiplier
      : 1;

    if (Math.abs(controlState.throttle) > 0.01) {
      const propellerPoint = Vector3.TransformCoordinates(
        this.ship.propellerLocalPoint,
        worldMatrix,
      );
      const propellerForce = forward.scale(
        throttleForce * controlState.throttle * boostMultiplier,
      );
      this.applyForceAtPoint(
        propellerForce,
        propellerPoint,
        totalForce,
        totalTorque,
      );
    }

    const forwardSpeed = Vector3.Dot(this.linearVelocity, forward);
    if (Math.abs(controlState.steer) > 0.01) {
      const rudderPoint = Vector3.TransformCoordinates(
        this.ship.rudderLocalPoint,
        worldMatrix,
      );
      const turnDirection = Vector3.Cross(Vector3.Up(), forward);
      const rudderForce = turnDirection.scale(
        controlState.steer *
          DEMO_CONFIG.propulsion.rudderForce *
          (0.35 + Math.abs(forwardSpeed)),
      );
      this.applyForceAtPoint(rudderForce, rudderPoint, totalForce, totalTorque);
    }

    totalForce.addInPlace(
      this.linearVelocity.scale(-DEMO_CONFIG.physics.airDrag),
    );
    totalTorque.addInPlace(
      this.angularVelocity.scale(-DEMO_CONFIG.physics.angularDamping),
    );
    totalTorque.addInPlace(
      this.angularVelocity.scale(
        -submergedVolume * DEMO_CONFIG.water.angularDrag,
      ),
    );

    const acceleration = totalForce.scale(1 / this.ship.mass);
    this.linearVelocity.addInPlace(acceleration.scale(clampedDelta));
    this.position.addInPlace(this.linearVelocity.scale(clampedDelta));

    const angularAcceleration = this.computeAngularAcceleration(totalTorque);
    this.angularVelocity.addInPlace(angularAcceleration.scale(clampedDelta));

    const rotationAmount = this.angularVelocity.length() * clampedDelta;
    if (rotationAmount > 1e-5) {
      const axis = this.angularVelocity.normalizeToNew();
      const deltaRotation = Quaternion.RotationAxis(axis, rotationAmount);
      this.orientation = deltaRotation.multiply(this.orientation);
      this.orientation.normalize();
    }

    this.ship.setPose(this.position, this.orientation);
    this.telemetry = this.createTelemetry(submergedVolume, accumulatedBuoyancyForce);
  }

  public reset(): void {
    const shipHeight = this.ship.topOffset - this.ship.bottomOffset;
    this.position = new Vector3(
      0,
      this.waterSurface.level + shipHeight * 0.52,
      0,
    );
    this.orientation = Quaternion.FromEulerAngles(0.06, 0.12, 0.08);
    this.linearVelocity = new Vector3(0, 0, 0);
    this.angularVelocity = new Vector3(0, 0, 0);
    this.ship.setPose(this.position, this.orientation);
    this.telemetry = this.createTelemetry(0, 0);
  }

  public getPosition(): Vector3 {
    return this.position.clone();
  }

  public getTelemetry(): ShipTelemetry {
    return this.telemetry;
  }

  private applyForceAtPoint(
    force: Vector3,
    point: Vector3,
    totalForce: Vector3,
    totalTorque: Vector3,
  ): void {
    totalForce.addInPlace(force);

    const leverArm = point.subtract(this.position);
    totalTorque.addInPlace(Vector3.Cross(leverArm, force));
  }

  private computeAngularAcceleration(worldTorque: Vector3): Vector3 {
    const inverseOrientationMatrix = Matrix.Identity();
    this.orientation.conjugate().toRotationMatrix(inverseOrientationMatrix);
    const localTorque = Vector3.TransformNormal(
      worldTorque,
      inverseOrientationMatrix,
    );
    const localAngularAcceleration = new Vector3(
      localTorque.x * this.ship.inverseInertiaLocal.x,
      localTorque.y * this.ship.inverseInertiaLocal.y,
      localTorque.z * this.ship.inverseInertiaLocal.z,
    );

    const orientationMatrix = Matrix.Identity();
    this.orientation.toRotationMatrix(orientationMatrix);
    return Vector3.TransformNormal(localAngularAcceleration, orientationMatrix);
  }

  private createTelemetry(
    submergedVolume: number,
    accumulatedBuoyancyForce: number,
  ): ShipTelemetry {
    const euler = this.orientation.toEulerAngles();
    const worldBottom = this.position.y + this.ship.bottomOffset;
    const draft = Math.max(0, this.waterSurface.level - worldBottom);
    const weightForce = this.ship.mass * DEMO_CONFIG.physics.gravity;

    return {
      speed: this.linearVelocity.length(),
      draft,
      rollDegrees: this.toDegrees(euler.z),
      pitchDegrees: this.toDegrees(euler.x),
      submergedPercent: (submergedVolume / this.ship.totalVolume) * 100,
      buoyancyBalance:
        weightForce > 0 ? accumulatedBuoyancyForce / weightForce : 0,
    };
  }

  private toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }
}
