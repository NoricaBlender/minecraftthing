export interface Aabb {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

export interface Int3 {
  x: number;
  y: number;
  z: number;
}

export const EPSILON = 1e-5;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function floorDiv(value: number, divisor: number): number {
  return Math.floor(value / divisor);
}

export function positiveMod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothStep(value: number): number {
  return value * value * (3 - 2 * value);
}

export function length2(x: number, z: number): number {
  return Math.sqrt(x * x + z * z);
}

export function chunkKey(chunkX: number, chunkZ: number): string {
  return `${chunkX},${chunkZ}`;
}

export function blockKey(x: number, y: number, z: number): string {
  return `${x},${y},${z}`;
}

export function intersectsAabb(a: Aabb, b: Aabb): boolean {
  return (
    a.minX < b.maxX &&
    a.maxX > b.minX &&
    a.minY < b.maxY &&
    a.maxY > b.minY &&
    a.minZ < b.maxZ &&
    a.maxZ > b.minZ
  );
}
