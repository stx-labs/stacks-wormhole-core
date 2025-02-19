import { Cl } from "@stacks/transactions";
import { expect, describe } from "vitest";
import { it, fc } from "@fast-check/vitest";
import { wormhole } from "./helpers";

// Constants from `wormhole-core`
const ACTION_SET_MESSAGE_FEE = 3;
const EXPECTED_CHAIN_ID = 0xc377; // Value for testnet/devnet/simnet

const contractName = "wormhole-core-v4";

describe(`${contractName}::parse-and-verify-set-message-fee-payload success`, () => {
  const accounts = simnet.getAccounts();
  const action = ACTION_SET_MESSAGE_FEE;
  const chain = EXPECTED_CHAIN_ID;
  const sender = accounts.get("wallet_1")!;

  it("should parse and return valid payload", () => {
    const fee = 123456789;
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
    expect(res.result).toBeOk(
      Cl.tuple({
        module: Cl.buffer(Uint8Array.from(wormhole.coreModule)),
        action: Cl.uint(action),
        fee: Cl.uint(fee),
        chain: Cl.uint(chain),
      }),
    );
  });
});
