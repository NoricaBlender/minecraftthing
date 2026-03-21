import { Mesh, Scene, StandardMaterial, VertexData } from "@babylonjs/core";

import { chunkKey } from "../utils/math";
import { BlockId } from "./blockTypes";
import { Chunk } from "./chunk";
import { ChunkMeshBuilder } from "./meshBuilder";

export class ChunkManager {
  private readonly chunks = new Map<string, Chunk>();
  private readonly meshBuilder = new ChunkMeshBuilder();

  public constructor(
    private readonly scene: Scene,
    private readonly chunkMaterial: StandardMaterial,
  ) {}

  public createChunk(chunkX: number, chunkZ: number): Chunk {
    const key = chunkKey(chunkX, chunkZ);
    const existing = this.chunks.get(key);
    if (existing) {
      return existing;
    }

    const chunk = new Chunk(chunkX, chunkZ);
    this.chunks.set(key, chunk);
    return chunk;
  }

  public getChunk(chunkX: number, chunkZ: number): Chunk | undefined {
    return this.chunks.get(chunkKey(chunkX, chunkZ));
  }

  public getAllChunks(): IterableIterator<Chunk> {
    return this.chunks.values();
  }

  public markChunkDirty(chunkX: number, chunkZ: number): void {
    const chunk = this.getChunk(chunkX, chunkZ);
    if (chunk) {
      chunk.isDirty = true;
    }
  }

  public updateVisibleChunks(
    centerChunkX: number,
    centerChunkZ: number,
    renderDistance: number,
    getBlockAtWorld: (x: number, y: number, z: number) => BlockId,
  ): void {
    const visibleKeys = new Set<string>();

    for (
      let chunkX = centerChunkX - renderDistance;
      chunkX <= centerChunkX + renderDistance;
      chunkX += 1
    ) {
      for (
        let chunkZ = centerChunkZ - renderDistance;
        chunkZ <= centerChunkZ + renderDistance;
        chunkZ += 1
      ) {
        const chunk = this.getChunk(chunkX, chunkZ);
        if (!chunk?.isGenerated) {
          continue;
        }

        visibleKeys.add(chunkKey(chunkX, chunkZ));

        if (chunk.isDirty || !chunk.mesh) {
          this.rebuildChunkMesh(chunk, getBlockAtWorld);
        }

        chunk.mesh?.setEnabled(true);
      }
    }

    for (const chunk of this.chunks.values()) {
      if (chunk.mesh && !visibleKeys.has(chunkKey(chunk.chunkX, chunk.chunkZ))) {
        chunk.mesh.setEnabled(false);
      }
    }
  }

  public dispose(): void {
    for (const chunk of this.chunks.values()) {
      chunk.dispose();
    }

    this.chunks.clear();
  }

  private rebuildChunkMesh(
    chunk: Chunk,
    getBlockAtWorld: (x: number, y: number, z: number) => BlockId,
  ): void {
    const meshData = this.meshBuilder.build(chunk, getBlockAtWorld);
    chunk.clearMesh();

    if (!meshData) {
      chunk.isDirty = false;
      return;
    }

    const mesh = new Mesh(`chunk-${chunk.chunkX}-${chunk.chunkZ}`, this.scene);
    const vertexData = new VertexData();
    vertexData.positions = meshData.positions;
    vertexData.indices = meshData.indices;
    vertexData.normals = meshData.normals;
    vertexData.colors = meshData.colors;
    vertexData.applyToMesh(mesh, false);

    mesh.material = this.chunkMaterial;
    mesh.isPickable = true;
    mesh.receiveShadows = false;
    mesh.setEnabled(true);

    chunk.mesh = mesh;
    chunk.isDirty = false;
  }
}
