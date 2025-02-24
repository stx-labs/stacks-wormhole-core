import { Cl } from "@stacks/transactions";
import { expect, describe } from "vitest";
import { it, fc } from "@fast-check/vitest";
import { wormhole } from "./helpers";

const MAX_VALUE_U128 = 340282366920938463463374607431768211455n;

// Constants from `wormhole-core`
const ACTION_TRANSFER_FEES = 4;
const ERR_TXF_CHECK_OVERLAY = 1607;
const ERR_TXF_CHECK_FEE = 1608;
const ERR_TXF_CHECK_MODULE = 1609;
const ERR_TXF_CHECK_ACTION = 1610;
const ERR_TXF_CHECK_CHAIN = 1611;
const EXPECTED_CHAIN_ID = 0xc377; // Value for testnet/devnet/simnet

const contractName = "wormhole-core-v4";

describe(`${contractName}::parse-and-verify-transfer-fees-payload success`, () => {
  const accounts = simnet.getAccounts();
  const action = ACTION_TRANSFER_FEES;
  const chain = EXPECTED_CHAIN_ID;
  const sender = accounts.get("wallet_1")!;
  const recipient = accounts.get("wallet_2")!;

  it("should return parsed payload", () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: MAX_VALUE_U128 }), (fcAmount) => {
        const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
          action,
          chain,
          fcAmount,
          recipient,
        );

        const res = simnet.callPublicFn(
          contractName,
          `parse-and-verify-transfer-fees-payload`,
          [Cl.buffer(Uint8Array.from(payload))],
          sender,
        );
        expect(res.result).toBeOk(
          Cl.tuple({
            module: Cl.buffer(Uint8Array.from(wormhole.coreModule)),
            action: Cl.uint(action),
            amount: Cl.uint(fcAmount),
            recipient: Cl.principal(recipient),
            chain: Cl.uint(chain),
          }),
        );
      }),
    );
  });
});

describe(`${contractName}::parse-and-verify-transfer-fees-payload failure`, () => {
  const accounts = simnet.getAccounts();
  const sender = accounts.get("wallet_1")!;
  const recipient = accounts.get("wallet_2")!;

  it("should fail if `amount` exceeds max `u128`", () => {
    const amount = MAX_VALUE_U128 + 1n;
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      ACTION_TRANSFER_FEES,
      EXPECTED_CHAIN_ID,
      amount,
      recipient,
    );

    const res = simnet.callPublicFn(
      contractName,
      `parse-and-verify-transfer-fees-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(ERR_TXF_CHECK_FEE));
  });

  it("should fail if `module` is not 'core'", () => {
    // "Dore" instead of "Core"
    const module = Buffer.from(
      "00000000000000000000000000000000000000000000000000000000446f7265",
      "hex",
    );
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      ACTION_TRANSFER_FEES,
      EXPECTED_CHAIN_ID,
      100,
      recipient,
      module,
    );

    const res = simnet.callPublicFn(
      contractName,
      `parse-and-verify-transfer-fees-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(ERR_TXF_CHECK_MODULE));
  });

  it("should fail if `action` does not correspond to Wormhole TransferFee message", () => {
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      7,
      EXPECTED_CHAIN_ID,
      100,
      recipient,
    );

    const res = simnet.callPublicFn(
      contractName,
      `parse-and-verify-transfer-fees-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(ERR_TXF_CHECK_ACTION));
  });

  it("should fail if `chain` does not this chain's ID", () => {
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      ACTION_TRANSFER_FEES,
      0x3333,
      100,
      recipient,
    );

    const res = simnet.callPublicFn(
      contractName,
      `parse-and-verify-transfer-fees-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(ERR_TXF_CHECK_CHAIN));
  });

  it.skip("should fail if payload is larger than expected", () => {
    let payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      ACTION_TRANSFER_FEES,
      EXPECTED_CHAIN_ID,
      100,
      recipient,
    );
    const validPayloadLen = payload.length;
    payload = Buffer.concat([Uint8Array.from(payload), new Uint8Array(1)]);
    const actualPayloadLen = payload.length;

    expect(actualPayloadLen).toBeGreaterThan(validPayloadLen);

    const res = simnet.callPublicFn(
      contractName,
      `parse-and-verify-transfer-fees-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(ERR_TXF_CHECK_OVERLAY));
  });

  // TODO: Payload too small
  // TODO: `recipient` not valid Stacks principle
});
