import type { StorageAdapter } from "./types";

export interface StorageVersionSnapshot {
  version: number;
  updatedAt: string;
}

export interface StorageMigrationOptions {
  metadataKey?: string;
  dataKeys: readonly string[];
  targetVersion: number;
  primary: StorageAdapter;
  fallback?: StorageAdapter;
  migrate?: (adapter: StorageAdapter, fromVersion: number, toVersion: number) => Promise<void>;
}

export interface StoragePreparationResult {
  adapter: StorageAdapter;
  usedFallback: boolean;
  migrated: boolean;
  version: number;
}

const DEFAULT_METADATA_KEY = "storage.schema.version";

function nowUtcIso(): string {
  return new Date().toISOString();
}

async function readVersion(
  adapter: StorageAdapter,
  metadataKey: string
): Promise<StorageVersionSnapshot | null> {
  const raw = await adapter.get(metadataKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StorageVersionSnapshot>;
    if (typeof parsed.version !== "number" || typeof parsed.updatedAt !== "string") {
      return null;
    }
    return {
      version: parsed.version,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

async function writeVersion(
  adapter: StorageAdapter,
  metadataKey: string,
  version: number
): Promise<void> {
  const payload: StorageVersionSnapshot = {
    version,
    updatedAt: nowUtcIso(),
  };
  await adapter.set(metadataKey, JSON.stringify(payload));
}

async function copyDataKeys(
  source: StorageAdapter,
  destination: StorageAdapter,
  dataKeys: readonly string[]
): Promise<void> {
  for (const key of dataKeys) {
    const value = await source.get(key);
    if (value !== null) {
      await destination.set(key, value);
    }
  }
}

async function prepareOnPrimary(options: StorageMigrationOptions): Promise<StoragePreparationResult> {
  const metadataKey = options.metadataKey ?? DEFAULT_METADATA_KEY;
  const snapshot = await readVersion(options.primary, metadataKey);
  const fromVersion = snapshot?.version ?? 0;

  let migrated = false;
  if (fromVersion < options.targetVersion) {
    if (options.migrate) {
      await options.migrate(options.primary, fromVersion, options.targetVersion);
    }
    await writeVersion(options.primary, metadataKey, options.targetVersion);
    migrated = true;
  }

  return {
    adapter: options.primary,
    usedFallback: false,
    migrated,
    version: Math.max(fromVersion, options.targetVersion),
  };
}

async function restoreFromFallback(
  options: StorageMigrationOptions,
  metadataKey: string,
  fallbackVersion: number
): Promise<StoragePreparationResult> {
  if (!options.fallback) {
    throw new Error("Fallback adapter is required but not provided");
  }

  await copyDataKeys(options.fallback, options.primary, options.dataKeys);
  await writeVersion(options.primary, metadataKey, fallbackVersion);

  return prepareOnPrimary(options);
}

export async function prepareVersionedStorage(
  options: StorageMigrationOptions
): Promise<StoragePreparationResult> {
  const metadataKey = options.metadataKey ?? DEFAULT_METADATA_KEY;

  try {
    const primarySnapshot = await readVersion(options.primary, metadataKey);

    if (!primarySnapshot && options.fallback) {
      const fallbackSnapshot = await readVersion(options.fallback, metadataKey);
      if (fallbackSnapshot) {
        return restoreFromFallback(options, metadataKey, fallbackSnapshot.version);
      }
    }

    return await prepareOnPrimary(options);
  } catch (primaryError) {
    if (!options.fallback) {
      throw primaryError;
    }

    const fallbackSnapshot = await readVersion(options.fallback, metadataKey);
    const fallbackVersion = fallbackSnapshot?.version ?? 0;

    if (fallbackVersion < options.targetVersion && options.migrate) {
      await options.migrate(options.fallback, fallbackVersion, options.targetVersion);
      await writeVersion(options.fallback, metadataKey, options.targetVersion);
      return {
        adapter: options.fallback,
        usedFallback: true,
        migrated: true,
        version: options.targetVersion,
      };
    }

    return {
      adapter: options.fallback,
      usedFallback: true,
      migrated: false,
      version: Math.max(fallbackVersion, options.targetVersion),
    };
  }
}
