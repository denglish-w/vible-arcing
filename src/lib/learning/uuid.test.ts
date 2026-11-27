import { describe, expect, it } from "vitest";
import { attemptInput } from "./validate.ts";
import { newUuid } from "./uuid.ts";

describe("newUuid", () => {
  it("uses randomUUID when the context has it", () => {
    const id = "3f2b8c1e-4d5a-4b6c-9d7e-8f9a0b1c2d3e";
    expect(
      newUuid({ randomUUID: () => id, getRandomValues: () => null as never }),
    ).toBe(id);
  });

  it("builds a valid version 4 UUID from getRandomValues without it", () => {
    const fallback = {
      getRandomValues: <T extends ArrayBufferView>(array: T): T => {
        new Uint8Array(array.buffer).fill(0xff);
        return array;
      },
    };
    const id = newUuid(fallback);
    expect(id).toBe("ffffffff-ffff-4fff-bfff-ffffffffffff");
    expect(
      attemptInput.safeParse({
        id,
        answer: { wordId: "n50001003001", lemma: "", pos: "", fields: {} },
      }).success,
    ).toBe(true);
  });

  it("gives different ids from the real generator", () => {
    const noNative = {
      getRandomValues: <T extends ArrayBufferView>(a: T) =>
        globalThis.crypto.getRandomValues(a),
    };
    expect(newUuid(noNative)).not.toBe(newUuid(noNative));
  });
});
