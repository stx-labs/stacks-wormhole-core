import { Cl } from "@stacks/transactions";
import { expect, describe } from "vitest";
import { it } from "@fast-check/vitest";

// Constants from `wormhole-core`
const DEFAULT_CONSISTENCY_LEVEL = 0;

const contractName = "wormhole-core-v4";

describe(`${contractName}::emit-message success`, () => {
  const accounts = simnet.getAccounts();
  const sender = accounts.get("wallet_1")!;

  it("should emit message and increment `sequence`", () => {
    const payload = Cl.buffer(new Uint8Array(1024));
    let nonce = Cl.uint(111);
    const consistencyLevel = Cl.none();

    let res = simnet.callPublicFn(
      contractName,
      `emit-message`,
      [payload, nonce, consistencyLevel],
      sender,
    );
    // `emit-message` returns the emitted message
    expect(res.result).toBeOk(
      Cl.tuple({
        emitter: Cl.principal(sender),
        nonce: nonce,
        sequence: Cl.uint(0),
        "consistency-level": Cl.uint(DEFAULT_CONSISTENCY_LEVEL),
        payload: payload
      }),
    );

    // Now send another message to check that `sequence` has incremented
    nonce = Cl.uint(222);

    res = simnet.callPublicFn(
      contractName,
      `emit-message`,
      [payload, nonce, consistencyLevel],
      sender,
    );
    expect(res.result).toBeOk(
      Cl.tuple({
        emitter: Cl.principal(sender),
        nonce: nonce,
        sequence: Cl.uint(1),
        "consistency-level": Cl.uint(DEFAULT_CONSISTENCY_LEVEL),
        payload: payload
      }),
    );
  });
});