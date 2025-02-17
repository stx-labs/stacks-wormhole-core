import { Cl } from "@stacks/transactions";
import { expect, describe } from "vitest";
import { it, fc } from "@fast-check/vitest";

// Constants from `wormhole-core`
const DEFAULT_CONSISTENCY_LEVEL = 0;
const ERR_EMIT_OVERFLOW_CONSISTENCY_LEVEL = 1401;
const ERR_EMIT_OVERFLOW_NONCE = 1402;

const contractName = "wormhole-core-v4";

describe(`${contractName}::emit-message success`, () => {
  const accounts = simnet.getAccounts();
  const deployer = accounts.get("deployer")!;
  const sender = accounts.get("wallet_1")!;

  it("should emit message and increment `sequence`", () => {
    const emitter = Cl.principal(sender);
    const payload = Cl.buffer(new Uint8Array(1024));
    const numMessages = 10;

    // Send 10 messages and check that sequence increments each time
    for (let i = 0; i < numMessages; i++) {
      const nonce = Cl.uint(1000 + i);

      const res = simnet.callPublicFn(
        contractName,
        `emit-message`,
        [payload, nonce, Cl.none()],
        sender,
      );
      expect(res.result).toBeOk(
        Cl.tuple({
          emitter,
          nonce,
          sequence: Cl.uint(i),
          "consistency-level": Cl.uint(DEFAULT_CONSISTENCY_LEVEL),
          payload,
        }),
      );
    }
  });

  it("should allow for custom consistency level", () => {
    const emitter = Cl.principal(sender);
    const payload = Cl.buffer(new Uint8Array(1024));
    const nonce = Cl.uint(111);

    let sequence = 0;

    fc.assert(
      fc
        .property(fc.nat(255), (fcConsistencyLevel) => {
          const consistencyLevel = Cl.uint(fcConsistencyLevel);
          const res = simnet.callPublicFn(
            contractName,
            `emit-message`,
            [payload, nonce, Cl.some(consistencyLevel)],
            sender,
          );
          expect(res.result).toBeOk(
            Cl.tuple({
              emitter,
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
    const emitter = Cl.principal(sender);
    const payload = Cl.buffer(new Uint8Array(1024));
    const nonce = Cl.uint(111);

    // Use default `consistency-level`
    const res = simnet.callPublicFn(
      contractName,
      `emit-message`,
      [payload, nonce, Cl.none()],
      sender,
    );
    expect(res.result).toBeOk(
      Cl.tuple({
        emitter,
        nonce,
        sequence: Cl.uint(0),
        "consistency-level": Cl.uint(DEFAULT_CONSISTENCY_LEVEL),
        payload,
      }),
    );
  });

  it("should allow any 32-bit nonce", () => {
    const emitter = Cl.principal(sender);
    const payload = Cl.buffer(new Uint8Array(1024));
    const consistencyLevel = Cl.uint(DEFAULT_CONSISTENCY_LEVEL);

    let sequence = 0;

    fc.assert(
      fc
        .property(fc.nat(2 ** 32 - 1), (fcNonce) => {
          const nonce = Cl.uint(fcNonce);
          const res = simnet.callPublicFn(
            contractName,
            `emit-message`,
            [payload, nonce, Cl.some(consistencyLevel)],
            sender,
          );
          expect(res.result).toBeOk(
            Cl.tuple({
              emitter,
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
    const emitter = Cl.principal(sender);
    const payload = Cl.buffer(new Uint8Array(1024));
    const numMessages = 10;
    const nonce = Cl.uint(1);

    // `wormhole-core ` should not check for nonce reuse
    for (let i = 0; i < numMessages; i++) {
      const res = simnet.callPublicFn(
        contractName,
        `emit-message`,
        [payload, nonce, Cl.none()],
        sender,
      );
      expect(res.result).toBeOk(
        Cl.tuple({
          emitter,
          nonce,
          sequence: Cl.uint(i),
          "consistency-level": Cl.uint(DEFAULT_CONSISTENCY_LEVEL),
          payload,
        }),
      );
    }
  });

  it("should use the calling contract's principal for `emitter`", () => {
    const payload = Cl.buffer(new Uint8Array(1024));
    const nonce = Cl.uint(111);

    let res = simnet.callPublicFn(
      contractName,
      `emit-message`,
      [payload, nonce, Cl.none()],
      sender,
    );
    expect(res.result).toBeOk(
      Cl.tuple({
        emitter: Cl.principal(sender),
        nonce,
        sequence: Cl.uint(0),
        "consistency-level": Cl.uint(DEFAULT_CONSISTENCY_LEVEL),
        payload,
      }),
    );

    const proxyContract = {
      name: "proxy-contract",
      code: [
        `(define-public (emit-message-proxy (payload (buff 8192)) (nonce uint) (consistency-level-opt (optional uint)))`,
        `  (contract-call? .${contractName} emit-message payload nonce consistency-level-opt))`,
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
      `emit-message-proxy`,
      [payload, nonce, Cl.none()],
      sender,
    );
    expect(res.result).toBeOk(
      Cl.tuple({
        emitter: Cl.principal(`${deployer}.${proxyContract.name}`),
        nonce,
        sequence: Cl.uint(0),
        "consistency-level": Cl.uint(DEFAULT_CONSISTENCY_LEVEL),
        payload,
      }),
    );
  });

  it("should allow payload size of 8192 bytes", () => {
    const emitter = Cl.principal(sender);
    const nonce = Cl.uint(5);

    // Create payload with random data
    const bufSize = 8192;
    let randomData = new Uint8Array(bufSize);
    (globalThis as any).crypto.getRandomValues(randomData);
    const payload = Cl.buffer(randomData);

    expect(payload.buffer.length).toBe(8192);

    let res = simnet.callPublicFn(
      contractName,
      `emit-message`,
      [payload, nonce, Cl.none()],
      sender,
    );
    expect(res.result).toBeOk(
      Cl.tuple({
        emitter,
        nonce,
        sequence: Cl.uint(0),
        "consistency-level": Cl.uint(DEFAULT_CONSISTENCY_LEVEL),
        payload,
      }),
    );
  });
});

describe(`${contractName}::emit-message failure`, () => {
  const accounts = simnet.getAccounts();
  const sender = accounts.get("wallet_1")!;

  it("should fail if `consistency-level` exceeds max `u8` size", () => {
    const payload = Cl.buffer(new Uint8Array(1024));
    const nonce = Cl.uint(1);
    const consistencyLevel = Cl.uint(2 ** 8);

    const res = simnet.callPublicFn(
      contractName,
      `emit-message`,
      [payload, nonce, Cl.some(consistencyLevel)],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(ERR_EMIT_OVERFLOW_CONSISTENCY_LEVEL));
  });

  it("should fail if `nonce` exceeds max `u32` size", () => {
    const payload = Cl.buffer(new Uint8Array(1024));
    const nonce = Cl.uint(2 ** 32);

    const res = simnet.callPublicFn(
      contractName,
      `emit-message`,
      [payload, nonce, Cl.none()],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(ERR_EMIT_OVERFLOW_NONCE));
  });

  it("should fail if `payload` exceeds 8192 bytes", () => {
    const payload = Cl.buffer(new Uint8Array(8192 + 1));
    const nonce = Cl.uint(1);

    // We don't get an error value because the contract is never called
    const f = () =>
      simnet.callPublicFn(
        contractName,
        `emit-message`,
        [payload, nonce, Cl.none()],
        sender,
      );

    expect(f).toThrowError();
  });

  it("should not increment `sequence` if send fails", () => {
    const emitter = Cl.principal(sender);
    const payload = Cl.buffer(new Uint8Array(1024));
    const attempts = 10;
    const nonce = Cl.uint(1);
    const consistencyLevel = Cl.uint(2 ** 8);

    // Should all fail and not increment `sequence`
    for (let i = 0; i < attempts; i++) {
      const res = simnet.callPublicFn(
        contractName,
        `emit-message`,
        [payload, nonce, Cl.some(consistencyLevel)],
        sender,
      );
      expect(res.result).toBeErr(Cl.uint(ERR_EMIT_OVERFLOW_CONSISTENCY_LEVEL));
    }

    // Should succeed and have `sequence` of `u0`
    let res = simnet.callPublicFn(
      contractName,
      `emit-message`,
      [payload, nonce, Cl.none()],
      sender,
    );
    expect(res.result).toBeOk(
      Cl.tuple({
        emitter,
        nonce,
        sequence: Cl.uint(0),
        "consistency-level": Cl.uint(DEFAULT_CONSISTENCY_LEVEL),
        payload,
      }),
    );
  });
});
