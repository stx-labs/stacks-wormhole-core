import { Cl } from "@stacks/transactions";
import { expect, describe, beforeEach } from "vitest";
import { it } from "@fast-check/vitest";
import { wormhole } from "./helpers";
import { WormholeCore as WC } from "./constants";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const sender = accounts.get("wallet_1")!;

describe(`${WC.CONTRACT_NAME}::protocol-agnostic-send`, () => {
  beforeEach(async () => {
    let res = wormhole.initializeStateContract(WC.CONTRACT_NAME, deployer);
    expect(res.result).toBeOk(Cl.bool(true));
  });

  it("should succeed with valid payload and nonce", () => {
    const payload = new Uint8Array(100);
    payload.fill(0xab);
    const nonce = 42;

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      "protocol-agnostic-send",
      [
        Cl.buffer(payload),
        Cl.none(), // unused1
        Cl.none(), // unused2
        Cl.some(Cl.uint(nonce)),
        Cl.none(), // consistency-level-opt
      ],
      sender,
    );
    expect(res.result).toBeOk(Cl.uint(0)); // sequence 0
  });

  it("should succeed with max-size payload (8192 bytes)", () => {
    const payload = new Uint8Array(8192);
    payload.fill(0xff);
    const nonce = 1;

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      "protocol-agnostic-send",
      [
        Cl.buffer(payload),
        Cl.none(),
        Cl.none(),
        Cl.some(Cl.uint(nonce)),
        Cl.none(),
      ],
      sender,
    );
    expect(res.result).toBeOk(Cl.uint(0));
  });

  it("should fail if payload exceeds 8192 bytes (ERR_PAS_PAYLOAD_LEN)", () => {
    const payload = new Uint8Array(8193);
    payload.fill(0xff);
    const nonce = 1;

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      "protocol-agnostic-send",
      [
        Cl.buffer(payload),
        Cl.none(),
        Cl.none(),
        Cl.some(Cl.uint(nonce)),
        Cl.none(),
      ],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_PAS_PAYLOAD_LEN));
  });

  it("should fail if nonce is none (ERR_PAS_NO_NONCE)", () => {
    const payload = new Uint8Array(100);

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      "protocol-agnostic-send",
      [
        Cl.buffer(payload),
        Cl.none(),
        Cl.none(),
        Cl.none(), // No nonce
        Cl.none(),
      ],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_PAS_NO_NONCE));
  });

  it("should pass through custom consistency level", () => {
    const payload = new Uint8Array(32);
    const nonce = 5;
    const consistencyLevel = 200;

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      "protocol-agnostic-send",
      [
        Cl.buffer(payload),
        Cl.none(),
        Cl.none(),
        Cl.some(Cl.uint(nonce)),
        Cl.some(Cl.uint(consistencyLevel)),
      ],
      sender,
    );
    expect(res.result).toBeOk(Cl.uint(0));
  });

  it("should increment sequence across calls", () => {
    const payload = new Uint8Array(32);

    for (let i = 0; i < 3; i++) {
      const res = simnet.callPublicFn(
        WC.CONTRACT_NAME,
        "protocol-agnostic-send",
        [
          Cl.buffer(payload),
          Cl.none(),
          Cl.none(),
          Cl.some(Cl.uint(i)),
          Cl.none(),
        ],
        sender,
      );
      expect(res.result).toBeOk(Cl.uint(i));
    }
  });

  // Note: "not active" case for protocol-agnostic-send is tested
  // in contract-upgrade.test.ts "operations blocked after contract upgrade"
});
