import { Cl } from "@stacks/transactions";
import { expect, describe, beforeEach, it } from "vitest";
import { wormhole } from "./helpers";
import {
  WormholeCore as WC,
  WormholeCoreState as WCS,
  MaxValue,
} from "./constants";
import { keccak_256 } from "@noble/hashes/sha3";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const sender = accounts.get("wallet_1")!;

// Inline Clarity contract that isolates `consume-emitter-sequence` logic
// with a `set-sequence` helper for testing the boundary condition.
const sequenceTestContract = {
  name: "sequence-overflow-test",
  code: [
    `(define-constant ERR_STATE_OVERFLOW_SEQUENCE (err u${WCS.ERR_STATE_OVERFLOW_SEQUENCE}))`,
    `(define-constant MAX_VALUE_U64 u${MaxValue.U64})`,
    ``,
    `(define-map emitter-sequence principal uint)`,
    ``,
    `;; Helper to set the sequence to an arbitrary value for testing`,
    `(define-public (set-sequence (emitter principal) (seq uint))`,
    `  (ok (map-set emitter-sequence emitter seq)))`,
    ``,
    `;; Exact same logic as wormhole-core-state::consume-emitter-sequence`,
    `;; minus the addr32 registration (not relevant to overflow behavior)`,
    `(define-public (consume-emitter-sequence (emitter principal))`,
    `  (let ((sequence (default-to u0 (map-get? emitter-sequence emitter))))`,
    `    (asserts! (< sequence MAX_VALUE_U64) ERR_STATE_OVERFLOW_SEQUENCE)`,
    `    (map-set emitter-sequence emitter (+ sequence u1))`,
    `    (ok sequence)))`,
    ``,
    `(define-read-only (get-sequence (emitter principal))`,
    `  (map-get? emitter-sequence emitter))`,
  ].join("\n"),
};

describe("consume-emitter-sequence overflow", () => {
  beforeEach(() => {
    const res = simnet.deployContract(
      sequenceTestContract.name,
      sequenceTestContract.code,
      null,
      deployer,
    );
    expect(res.result).toBeBool(true);
  });

  it("should fail when sequence equals MAX_VALUE_U64", () => {
    // Set sequence to MAX_VALUE_U64
    let res = simnet.callPublicFn(
      sequenceTestContract.name,
      "set-sequence",
      [Cl.principal(sender), Cl.uint(MaxValue.U64)],
      deployer,
    );
    expect(res.result).toBeOk(Cl.bool(true));

    // Consuming should fail with overflow error
    res = simnet.callPublicFn(
      sequenceTestContract.name,
      "consume-emitter-sequence",
      [Cl.principal(sender)],
      deployer,
    );
    expect(res.result).toBeErr(Cl.uint(WCS.ERR_STATE_OVERFLOW_SEQUENCE));
  });

  it("should succeed when sequence is MAX_VALUE_U64 - 1 (last valid)", () => {
    const lastValid = MaxValue.U64 - 1n;

    // Set sequence to MAX_VALUE_U64 - 1
    let res = simnet.callPublicFn(
      sequenceTestContract.name,
      "set-sequence",
      [Cl.principal(sender), Cl.uint(lastValid)],
      deployer,
    );
    expect(res.result).toBeOk(Cl.bool(true));

    // This call should succeed and return the current sequence
    res = simnet.callPublicFn(
      sequenceTestContract.name,
      "consume-emitter-sequence",
      [Cl.principal(sender)],
      deployer,
    );
    expect(res.result).toBeOk(Cl.uint(lastValid));

    // Verify the sequence was incremented to MAX_VALUE_U64
    const readRes = simnet.callReadOnlyFn(
      sequenceTestContract.name,
      "get-sequence",
      [Cl.principal(sender)],
      deployer,
    );
    expect(readRes.result).toBeSome(Cl.uint(MaxValue.U64));
  });

  it("should fail on the next call after reaching MAX_VALUE_U64", () => {
    const lastValid = MaxValue.U64 - 1n;

    // Set sequence to MAX_VALUE_U64 - 1
    let res = simnet.callPublicFn(
      sequenceTestContract.name,
      "set-sequence",
      [Cl.principal(sender), Cl.uint(lastValid)],
      deployer,
    );
    expect(res.result).toBeOk(Cl.bool(true));

    // First call succeeds (sequence goes from MAX-1 to MAX)
    res = simnet.callPublicFn(
      sequenceTestContract.name,
      "consume-emitter-sequence",
      [Cl.principal(sender)],
      deployer,
    );
    expect(res.result).toBeOk(Cl.uint(lastValid));

    // Second call should fail because sequence is now MAX_VALUE_U64
    res = simnet.callPublicFn(
      sequenceTestContract.name,
      "consume-emitter-sequence",
      [Cl.principal(sender)],
      deployer,
    );
    expect(res.result).toBeErr(Cl.uint(WCS.ERR_STATE_OVERFLOW_SEQUENCE));
  });

  it("should not increment sequence when overflow is detected", () => {
    // Set sequence to MAX_VALUE_U64
    let res = simnet.callPublicFn(
      sequenceTestContract.name,
      "set-sequence",
      [Cl.principal(sender), Cl.uint(MaxValue.U64)],
      deployer,
    );
    expect(res.result).toBeOk(Cl.bool(true));

    // Attempt to consume (should fail)
    res = simnet.callPublicFn(
      sequenceTestContract.name,
      "consume-emitter-sequence",
      [Cl.principal(sender)],
      deployer,
    );
    expect(res.result).toBeErr(Cl.uint(WCS.ERR_STATE_OVERFLOW_SEQUENCE));

    // Verify sequence was NOT changed
    const readRes = simnet.callReadOnlyFn(
      sequenceTestContract.name,
      "get-sequence",
      [Cl.principal(sender)],
      deployer,
    );
    expect(readRes.result).toBeSome(Cl.uint(MaxValue.U64));
  });
});

describe(`${WC.CONTRACT_NAME}::post-message sequence overflow`, () => {
  const emitterPrincipal = Cl.principal(sender);
  const emitter = Cl.buffer(keccak_256(sender));

  beforeEach(async () => {
    let res = wormhole.initializeStateContract(WC.CONTRACT_NAME, deployer);
    expect(res.result).toBeOk(Cl.bool(true));
  });

  it("should return sequence starting at 0 and increment correctly", () => {
    const payload = Cl.buffer(new Uint8Array(32));
    const nonce = Cl.uint(1);

    // First message should have sequence 0
    let res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      "post-message",
      [payload, nonce, Cl.none()],
      sender,
    );
    expect(res.result).toBeOk(
      Cl.tuple({
        "emitter-principal": emitterPrincipal,
        emitter,
        nonce,
        sequence: Cl.uint(0),
        "consistency-level": Cl.uint(WC.DEFAULT_CONSISTENCY_LEVEL),
        payload,
      }),
    );

    // Second message should have sequence 1
    res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      "post-message",
      [payload, nonce, Cl.none()],
      sender,
    );
    expect(res.result).toBeOk(
      Cl.tuple({
        "emitter-principal": emitterPrincipal,
        emitter,
        nonce,
        sequence: Cl.uint(1),
        "consistency-level": Cl.uint(WC.DEFAULT_CONSISTENCY_LEVEL),
        payload,
      }),
    );

    // Verify the sequence is tracked in the state contract
    const readRes = simnet.callReadOnlyFn(
      WCS.CONTRACT_NAME,
      "emitter-sequence-get",
      [Cl.principal(sender)],
      deployer,
    );
    expect(readRes.result).toBeSome(Cl.uint(2));
  });
});
