export const RNG_VERSION = "rng.xoshiro128ss.1" as const;

export type RngNamespace =
  | "TEAM_ASSIGNMENT"
  | "FACILITY_PLACEMENT"
  | "OBJECTIVE_PLACEMENT"
  | "MOLE_ASSIGNMENT"
  | "ACTION_SUCCESS"
  | "TIE_BREAK"
  | "MOVEMENT_ORDER"
  | "REINFORCEMENT_PLACEMENT";

export interface DeterministicRng {
  nextUint32(): number;
  nextInt(upperExclusive: number): number;
  shuffle<T>(values: readonly T[]): readonly T[];
}

function rotateLeft(value: number, shift: number): number {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

/** xmur3: stable 32-bit seed expansion, not a source of entropy. */
function seedWords(value: string): [number, number, number, number] {
  let hash = 1_779_033_703 ^ value.length;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 3_432_918_353);
    hash = rotateLeft(hash, 13);
  }

  const drawWord = (): number => {
    hash = Math.imul(hash ^ (hash >>> 16), 2_246_822_507);
    hash = Math.imul(hash ^ (hash >>> 13), 3_266_489_909);
    hash ^= hash >>> 16;
    return hash >>> 0;
  };

  const words: [number, number, number, number] = [
    drawWord(),
    drawWord(),
    drawWord(),
    drawWord(),
  ];

  if (words.every((word) => word === 0)) {
    words[0] = 1;
  }
  return words;
}

class Xoshiro128StarStar implements DeterministicRng {
  readonly #state: [number, number, number, number];

  constructor(seed: string) {
    this.#state = seedWords(seed);
  }

  nextUint32(): number {
    const state = this.#state;
    const result = Math.imul(rotateLeft(Math.imul(state[1], 5), 7), 9) >>> 0;
    const temporary = state[1] << 9;

    state[2] ^= state[0];
    state[3] ^= state[1];
    state[1] ^= state[2];
    state[0] ^= state[3];
    state[2] ^= temporary;
    state[3] = rotateLeft(state[3], 11);

    state[0] >>>= 0;
    state[1] >>>= 0;
    state[2] >>>= 0;
    return result;
  }

  nextInt(upperExclusive: number): number {
    if (
      !Number.isSafeInteger(upperExclusive) ||
      upperExclusive <= 0 ||
      upperExclusive > 0x1_0000_0000
    ) {
      throw new RangeError(
        "upperExclusive must be a positive safe integer no greater than 2^32.",
      );
    }

    const uint32Range = 0x1_0000_0000;
    const acceptedRange =
      Math.floor(uint32Range / upperExclusive) * upperExclusive;
    let value: number;
    do {
      value = this.nextUint32();
    } while (value >= acceptedRange);

    return value % upperExclusive;
  }

  shuffle<T>(values: readonly T[]): readonly T[] {
    const shuffled = [...values];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = this.nextInt(index + 1);
      const current = shuffled[index];
      shuffled[index] = shuffled[swapIndex] as T;
      shuffled[swapIndex] = current as T;
    }
    return shuffled;
  }
}

export function createRng(input: {
  readonly seed: string;
  readonly namespace: RngNamespace;
}): DeterministicRng {
  if (input.seed.length === 0) {
    throw new RangeError("A non-empty server-provided RNG seed is required.");
  }
  return new Xoshiro128StarStar(
    `${RNG_VERSION}\u0000${input.namespace}\u0000${input.seed}`,
  );
}

export function rollPercent(
  rng: DeterministicRng,
  successRate: number,
): boolean {
  if (!Number.isInteger(successRate) || successRate < 0 || successRate > 100) {
    throw new RangeError("successRate must be an integer from 0 to 100.");
  }
  return rng.nextInt(100) < successRate;
}
