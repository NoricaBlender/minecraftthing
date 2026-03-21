import { blockKey } from "../utils/math";
import { BlockId } from "./blockTypes";

interface StoredWorldEdits {
  version: number;
  seed: number;
  edits: Record<string, BlockId>;
}

export class WorldStorage {
  private readonly storageKey: string;
  private readonly edits = new Map<string, BlockId>();
  private readonly seed: number;

  public constructor(prefix: string, seed: number) {
    this.storageKey = `${prefix}:${seed}`;
    this.seed = seed;
  }

  public load(): ReadonlyMap<string, BlockId> {
    this.edits.clear();

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) {
        return this.edits;
      }

      const parsed = JSON.parse(raw) as Partial<StoredWorldEdits>;
      if (
        parsed.version !== 1 ||
        typeof parsed.edits !== "object" ||
        parsed.edits === null
      ) {
        return this.edits;
      }

      for (const [key, value] of Object.entries(parsed.edits)) {
        if (typeof value === "number") {
          this.edits.set(key, value as BlockId);
        }
      }
    } catch {
      return this.edits;
    }

    return this.edits;
  }

  public recordEdit(x: number, y: number, z: number, blockId: BlockId): void {
    this.edits.set(blockKey(x, y, z), blockId);
    this.flush();
  }

  private flush(): void {
    try {
      const payload: StoredWorldEdits = {
        version: 1,
        seed: this.seed,
        edits: Object.fromEntries(this.edits),
      };

      window.localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch {
      // Ignore storage failures to keep gameplay running.
    }
  }
}
