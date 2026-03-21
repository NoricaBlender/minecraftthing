import { lerp, smoothStep } from "./math";

function hash(seed: number, x: number, z: number): number {
  let value = seed ^ (x * 374761393) ^ (z * 668265263);
  value = (value ^ (value >> 13)) * 1274126177;
  value ^= value >> 16;
  return (value >>> 0) / 4294967295;
}

export function hash2D(seed: number, x: number, z: number): number {
  return hash(seed, x, z);
}

export class FractalNoise2D {
  public constructor(private readonly seed: number) {}

  public sample(
    x: number,
    z: number,
    octaves = 4,
    persistence = 0.5,
    lacunarity = 2,
  ): number {
    let amplitude = 1;
    let frequency = 1;
    let total = 0;
    let amplitudeSum = 0;

    for (let octave = 0; octave < octaves; octave += 1) {
      total += this.sampleValueNoise(x * frequency, z * frequency) * amplitude;
      amplitudeSum += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return amplitudeSum === 0 ? 0 : total / amplitudeSum;
  }

  private sampleValueNoise(x: number, z: number): number {
    const x0 = Math.floor(x);
    const z0 = Math.floor(z);
    const x1 = x0 + 1;
    const z1 = z0 + 1;
    const tx = smoothStep(x - x0);
    const tz = smoothStep(z - z0);

    const n00 = hash(this.seed, x0, z0);
    const n10 = hash(this.seed, x1, z0);
    const n01 = hash(this.seed, x0, z1);
    const n11 = hash(this.seed, x1, z1);

    const nx0 = lerp(n00, n10, tx);
    const nx1 = lerp(n01, n11, tx);

    return lerp(nx0, nx1, tz);
  }
}
