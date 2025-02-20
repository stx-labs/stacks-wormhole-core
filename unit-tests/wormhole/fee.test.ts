import { Cl } from "@stacks/transactions";
import { expect, describe } from "vitest";
import { it, fc } from "@fast-check/vitest";
import { wormhole } from "./helpers";

const MAX_VALUE_U128 = 340282366920938463463374607431768211455n;

// Constants from `wormhole-core`
const ACTION_SET_MESSAGE_FEE = 3;
const ERR_SMF_CHECK_OVERLAY = 1506;
const ERR_SMF_CHECK_FEE = 1507;
const ERR_SMF_CHECK_MODULE = 1508;
const ERR_SMF_CHECK_ACTION = 1509;
const ERR_SMF_CHECK_CHAIN = 1510;
const EXPECTED_CHAIN_ID = 0xc377; // Value for testnet/devnet/simnet

const contractName = "wormhole-core-v4";

describe(`${contractName}::parse-and-verify-set-message-fee-payload success`, () => {
  const accounts = simnet.getAccounts();
  const action = ACTION_SET_MESSAGE_FEE;
  const chain = EXPECTED_CHAIN_ID;
  const sender = accounts.get("wallet_1")!;

  it("should parse and return valid payload", () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: MAX_VALUE_U128 }), (fcFee) => {
        const payload = wormhole.serializeSetMessageFeeVaaPayloadToBuffer(
          action,
          chain,
          fcFee,
        );

        const res = simnet.callPublicFn(
          contractName,
          `parse-and-verify-set-message-fee-payload`,
          [Cl.buffer(Uint8Array.from(payload))],
          sender,
        );
        expect(res.result).toBeOk(
          Cl.tuple({
            module: Cl.buffer(Uint8Array.from(wormhole.coreModule)),
            action: Cl.uint(action),
            fee: Cl.uint(fcFee),
            chain: Cl.uint(chain),
          }),
        );
      }),
    );
  });
});

describe(`${contractName}::parse-and-verify-set-message-fee-payload failure`, () => {
  const accounts = simnet.getAccounts();
  const sender = accounts.get("wallet_1")!;

  it("should fail if `fee` exceeds max `u128`", () => {
    const fee = MAX_VALUE_U128 + 1n;
    const payload = wormhole.serializeSetMessageFeeVaaPayloadToBuffer(
      ACTION_SET_MESSAGE_FEE,
      EXPECTED_CHAIN_ID,
      fee,
    );

    const res = simnet.callPublicFn(
      contractName,
      `parse-and-verify-set-message-fee-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(ERR_SMF_CHECK_FEE));
  });

  it("should fail if `module` is not 'core'", () => {
    // "Dore" instead of "Core"
    const module = Buffer.from(
      "00000000000000000000000000000000000000000000000000000000446f7265",
      "hex",
    );
    const payload = wormhole.serializeSetMessageFeeVaaPayloadToBuffer(
      ACTION_SET_MESSAGE_FEE,
      EXPECTED_CHAIN_ID,
      100,
      module,
    );

    const res = simnet.callPublicFn(
      contractName,
      `parse-and-verify-set-message-fee-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(ERR_SMF_CHECK_MODULE));
  });

  it("should fail if `action` does not correspond to Wormhole SetMessageFee message", () => {
    const payload = wormhole.serializeSetMessageFeeVaaPayloadToBuffer(
      7,
      EXPECTED_CHAIN_ID,
      100,
    );

    const res = simnet.callPublicFn(
      contractName,
      `parse-and-verify-set-message-fee-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(ERR_SMF_CHECK_ACTION));
  });

  it("should fail if `chain` does not this chain's ID", () => {
    const payload = wormhole.serializeSetMessageFeeVaaPayloadToBuffer(
      ACTION_SET_MESSAGE_FEE,
      0x3333,
      100,
    );

    const res = simnet.callPublicFn(
      contractName,
      `parse-and-verify-set-message-fee-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(ERR_SMF_CHECK_CHAIN));
  });

  // TODO: Payload too big/small
  it("should fail if payload is larger than expected", () => {
    let payload = wormhole.serializeSetMessageFeeVaaPayloadToBuffer(
      ACTION_SET_MESSAGE_FEE,
      EXPECTED_CHAIN_ID,
      100,
    );
    const validPayloadLen = payload.length;
    payload = Buffer.concat([Uint8Array.from(payload), new Uint8Array(1)]);
    const actualPayloadLen = payload.length;

    expect(actualPayloadLen).toBeGreaterThan(validPayloadLen);

    const res = simnet.callPublicFn(
      contractName,
      `parse-and-verify-set-message-fee-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(ERR_SMF_CHECK_OVERLAY));
  });
});
