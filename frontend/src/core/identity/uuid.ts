export interface UuidGenerator {
  nextId(): string;
}

function createUuidFromRandomValues(randomValues: Uint8Array): string {
  // RFC4122 v4 bit layout
  randomValues[6] = (randomValues[6] & 0x0f) | 0x40;
  randomValues[8] = (randomValues[8] & 0x3f) | 0x80;

  const hex = Array.from(randomValues, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

function fallbackUuid(): string {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const randomValues = new Uint8Array(16);
    globalThis.crypto.getRandomValues(randomValues);
    return createUuidFromRandomValues(randomValues);
  }

  const seed = `${Date.now()}-${Math.random()}-${Math.random()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const suffix = Math.abs(hash).toString(16).padStart(8, "0");
  return `legacy-${Date.now().toString(16)}-${suffix}`;
}

export function createUuidGenerator(): UuidGenerator {
  return {
    nextId() {
      if (typeof globalThis.crypto?.randomUUID === "function") {
        return globalThis.crypto.randomUUID();
      }
      return fallbackUuid();
    },
  };
}

export function generateUuid(): string {
  return createUuidGenerator().nextId();
}
