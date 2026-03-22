export const DEMO_CONFIG = {
  ship: {
    blockSize: 0.82,
  },
  water: {
    level: 0,
    density: 1,
    linearDrag: 7.6,
    angularDrag: 2.4,
    lateralGrip: 4.6,
  },
  physics: {
    gravity: 14,
    airDrag: 0.45,
    angularDamping: 0.82,
    maxDeltaSeconds: 1 / 30,
  },
  propulsion: {
    forwardForce: 42,
    reverseForce: 24,
    rudderForce: 18,
    boostMultiplier: 1.22,
  },
  camera: {
    alpha: -Math.PI / 2.1,
    beta: 1.13,
    radius: 20,
    followLerp: 0.1,
  },
  world: {
    waterSize: 240,
    seabedDepth: 14,
  },
} as const;
