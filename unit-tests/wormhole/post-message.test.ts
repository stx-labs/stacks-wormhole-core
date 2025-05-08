import { Cl } from "@stacks/transactions";
import { expect, describe, beforeEach } from "vitest";
import { it, fc } from "@fast-check/vitest";
import { wormhole } from "./helpers";
import { WormholeCore as WC } from "./constants";
import { keccak_256 } from "@noble/hashes/sha3";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const sender = accounts.get("wallet_1")!;
const emitter = Cl.principal(sender);
const emitterHash = Cl.buffer(keccak_256(sender));

describe(`${WC.CONTRACT_NAME}::post-message success`, () => {
  beforeEach(async () => {
    let res = wormhole.initializeStateContract(WC.CONTRACT_NAME, deployer);
    expect(res.result).toBeOk(Cl.bool(true));
  });

  it("should emit message and increment `sequence`", () => {
    const payload = Cl.buffer(new Uint8Array(1024));
    const numMessages = 10;

    // Send 10 messages and check that sequence increments each time
    for (let i = 0; i < numMessages; i++) {
      const nonce = Cl.uint(1000 + i);

      const res = simnet.callPublicFn(
        WC.CONTRACT_NAME,
        `post-message`,
        [payload, nonce, Cl.none()],
        sender,
      );
      expect(res.result).toBeOk(
        Cl.tuple({
          emitter,
          "emitter-keccak256": emitterHash,
          nonce,
          sequence: Cl.uint(i),
          "consistency-level": Cl.uint(WC.DEFAULT_CONSISTENCY_LEVEL),
          payload,
        }),
      );
    }
  });

  it("should allow for custom consistency level", () => {
    const payload = Cl.buffer(new Uint8Array(1024));
    const nonce = Cl.uint(111);

    let sequence = 0;

    fc.assert(
      fc
        .property(fc.nat(255), (fcConsistencyLevel) => {
          const consistencyLevel = Cl.uint(fcConsistencyLevel);
          const res = simnet.callPublicFn(
            WC.CONTRACT_NAME,
            `post-message`,
            [payload, nonce, Cl.some(consistencyLevel)],
            sender,
          );
          expect(res.result).toBeOk(
            Cl.tuple({
              emitter,
              "emitter-keccak256": emitterHash,
              nonce,
              sequence: Cl.uint(sequence),
              "consistency-level": consistencyLevel,
              payload,
            }),
          );
        })
        .afterEach(() => (sequence += 1)),
    );
  });

  it("should default to 0 if `consistency-level` not specified", () => {
    const payload = Cl.buffer(new Uint8Array(1024));
    const nonce = Cl.uint(111);

    // Use default `consistency-level`
    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `post-message`,
      [payload, nonce, Cl.none()],
      sender,
    );
    expect(res.result).toBeOk(
      Cl.tuple({
        emitter,
        "emitter-keccak256": emitterHash,
        nonce,
        sequence: Cl.uint(0),
        "consistency-level": Cl.uint(WC.DEFAULT_CONSISTENCY_LEVEL),
        payload,
      }),
    );
  });

  it("should allow any 32-bit nonce", () => {
    const payload = Cl.buffer(new Uint8Array(1024));
    const consistencyLevel = Cl.uint(WC.DEFAULT_CONSISTENCY_LEVEL);

    let sequence = 0;

    fc.assert(
      fc
        .property(fc.nat(2 ** 32 - 1), (fcNonce) => {
          const nonce = Cl.uint(fcNonce);
          const res = simnet.callPublicFn(
            WC.CONTRACT_NAME,
            `post-message`,
            [payload, nonce, Cl.some(consistencyLevel)],
            sender,
          );
          expect(res.result).toBeOk(
            Cl.tuple({
              emitter,
              "emitter-keccak256": emitterHash,
              nonce,
              sequence: Cl.uint(sequence),
              "consistency-level": consistencyLevel,
              payload,
            }),
          );
        })
        .afterEach(() => (sequence += 1)),
    );
  });

  it("should allow `nonce` reuse", () => {
    const payload = Cl.buffer(new Uint8Array(1024));
    const numMessages = 10;
    const nonce = Cl.uint(1);

    // `wormhole-core ` should not check for nonce reuse
    for (let i = 0; i < numMessages; i++) {
      const res = simnet.callPublicFn(
        WC.CONTRACT_NAME,
        `post-message`,
        [payload, nonce, Cl.none()],
        sender,
      );
      expect(res.result).toBeOk(
        Cl.tuple({
          emitter,
          "emitter-keccak256": emitterHash,
          nonce,
          sequence: Cl.uint(i),
          "consistency-level": Cl.uint(WC.DEFAULT_CONSISTENCY_LEVEL),
          payload,
        }),
      );
    }
  });

  it("should use the calling contract's principal for `emitter`", () => {
    const payload = Cl.buffer(new Uint8Array(1024));
    const nonce = Cl.uint(111);

    let res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `post-message`,
      [payload, nonce, Cl.none()],
      sender,
    );
    expect(res.result).toBeOk(
      Cl.tuple({
        emitter,
        "emitter-keccak256": emitterHash,
        nonce,
        sequence: Cl.uint(0),
        "consistency-level": Cl.uint(WC.DEFAULT_CONSISTENCY_LEVEL),
        payload,
      }),
    );

    const proxyContract = {
      name: "proxy-contract",
      code: [
        `(define-public (post-message-proxy (payload (buff 4096)) (nonce uint) (consistency-level-opt (optional uint)))`,
        `  (contract-call? .${WC.CONTRACT_NAME} post-message payload nonce consistency-level-opt))`,
      ].join("\n"),
    };

    res = simnet.deployContract(
      proxyContract.name,
      proxyContract.code,
      null,
      deployer,
    );

    // Check contract was published ok
    expect(res.result).toBeBool(true);

    // Check that `emitter` is the proxy contract and `sequence` is 0
    res = simnet.callPublicFn(
      proxyContract.name,
      `post-message-proxy`,
      [payload, nonce, Cl.none()],
      sender,
    );
    const proxyAddress = `${deployer}.${proxyContract.name}`;
    expect(res.result).toBeOk(
      Cl.tuple({
        emitter: Cl.principal(proxyAddress),
        "emitter-keccak256": Cl.buffer(keccak_256(proxyAddress)),
        nonce,
        sequence: Cl.uint(0),
        "consistency-level": Cl.uint(WC.DEFAULT_CONSISTENCY_LEVEL),
        payload,
      }),
    );
  });

  it("should allow payload size of 4096 bytes", () => {
    const nonce = Cl.uint(5);

    // Create payload with random data
    const bufSize = 4096;
    let randomData = new Uint8Array(bufSize);
    (globalThis as any).crypto.getRandomValues(randomData);
    const payload = Cl.buffer(randomData);

    expect(payload.buffer.length).toBe(4096);

    let res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `post-message`,
      [payload, nonce, Cl.none()],
      sender,
    );
    expect(res.result).toBeOk(
      Cl.tuple({
        emitter,
        "emitter-keccak256": emitterHash,
        nonce,
        sequence: Cl.uint(0),
        "consistency-level": Cl.uint(WC.DEFAULT_CONSISTENCY_LEVEL),
        payload,
      }),
    );
  });
});

describe(`${WC.CONTRACT_NAME}::post-message failure`, () => {
  const accounts = simnet.getAccounts();
  const deployer = accounts.get("deployer")!;
  const sender = accounts.get("wallet_1")!;

  beforeEach(async () => {
    let res = wormhole.initializeStateContract(WC.CONTRACT_NAME, deployer);
    expect(res.result).toBeOk(Cl.bool(true));
  });

  it("should fail if `consistency-level` exceeds max `u8` size", () => {
    const payload = Cl.buffer(new Uint8Array(1024));
    const nonce = Cl.uint(1);
    const consistencyLevel = Cl.uint(2 ** 8);

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `post-message`,
      [payload, nonce, Cl.some(consistencyLevel)],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_POST_OVERFLOW_CONSISTENCY_LEVEL));
  });

  it("should fail if `nonce` exceeds max `u32` size", () => {
    const payload = Cl.buffer(new Uint8Array(1024));
    const nonce = Cl.uint(2 ** 32);

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `post-message`,
      [payload, nonce, Cl.none()],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_POST_OVERFLOW_NONCE));
  });

  it("should fail if `payload` exceeds 4096 bytes", () => {
    const payload = Cl.buffer(new Uint8Array(4096 + 1));
    const nonce = Cl.uint(1);

    // We don't get an error value because the contract is never called
    const f = () =>
      simnet.callPublicFn(
        WC.CONTRACT_NAME,
        `post-message`,
        [payload, nonce, Cl.none()],
        sender,
      );

    expect(f).toThrowError();
  });

  it("should not increment `sequence` if send fails", () => {
    const payload = Cl.buffer(new Uint8Array(1024));
    const attempts = 10;
    const nonce = Cl.uint(1);
    const consistencyLevel = Cl.uint(2 ** 8);

    // Should all fail and not increment `sequence`
    for (let i = 0; i < attempts; i++) {
      const res = simnet.callPublicFn(
        WC.CONTRACT_NAME,
        `post-message`,
        [payload, nonce, Cl.some(consistencyLevel)],
        sender,
      );
      expect(res.result).toBeErr(
        Cl.uint(WC.ERR_POST_OVERFLOW_CONSISTENCY_LEVEL),
      );
    }

    // Should succeed and have `sequence` of `u0`
    let res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `post-message`,
      [payload, nonce, Cl.none()],
      sender,
    );
    expect(res.result).toBeOk(
      Cl.tuple({
        emitter,
        "emitter-keccak256": emitterHash,
        nonce,
        sequence: Cl.uint(0),
        "consistency-level": Cl.uint(WC.DEFAULT_CONSISTENCY_LEVEL),
        payload,
      }),
    );
  });
});
