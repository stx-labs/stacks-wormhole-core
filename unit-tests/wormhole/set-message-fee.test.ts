import { Cl } from "@stacks/transactions";
import { expect, describe, beforeEach } from "vitest";
import { it, fc } from "@fast-check/vitest";
import { wormhole } from "./helpers";

const MAX_VALUE_U128 = 340282366920938463463374607431768211455n;

// Constants from `wormhole-core`
const ACTION_SET_MESSAGE_FEE = 3;
const ERR_SMF_CHECK_OVERLAY = 1507;
const ERR_SMF_CHECK_FEE = 1508;
const ERR_SMF_CHECK_MODULE = 1509;
const ERR_SMF_CHECK_ACTION = 1510;
const ERR_SMF_CHECK_CHAIN = 1511;
const ERR_GOV_CHECK_REPLAY = 1702;
const EXPECTED_CHAIN_ID = 0xc377; // Value for testnet/devnet/simnet

const contractName = "wormhole-core-v4";

describe(`${contractName}::parse-and-verify-set-message-fee-payload success`, () => {
  const accounts = simnet.getAccounts();
  const action = ACTION_SET_MESSAGE_FEE;
  const chain = EXPECTED_CHAIN_ID;
  const sender = accounts.get("wallet_1")!;

  it("should return parsed payload", () => {
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

  it("should fail if `chain` does not match this chain's ID", () => {
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

  // TODO: Payload too small
});

describe(`${contractName}::set-message-fee`, () => {
  const accounts = simnet.getAccounts();
  const deployer = accounts.get("deployer")!;
  const sender = accounts.get("wallet_1")!;
  const keychain = wormhole.generateGuardianSetKeychain(19);

  // Before starting the test suite, we have to setup the guardian set.
  beforeEach(async () => {
    let [result, vaaHeader, vaaBody] = wormhole.applyGuardianSetUpdate(
      keychain,
      1,
      deployer,
      contractName,
    );
    let [serializeVaaToClarityValue, _] = wormhole.serializeVaaToClarityValue(
      vaaHeader as wormhole.VaaHeader,
      vaaBody as wormhole.VaaBody,
      keychain,
    );

    expect(result).toBeOk(
      Cl.tuple({
        result: Cl.tuple({
          "guardians-eth-addresses": Cl.list(
            keychain.map((g) => Cl.buffer(g.ethereumAddress)),
          ),
          "guardians-public-keys": Cl.list(
            keychain.map((g) => Cl.buffer(g.uncompressedPublicKey)),
          ),
        }),
        vaa: serializeVaaToClarityValue,
      }),
    );
  });

  it("should succeed and return `ok(fee)`", () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: MAX_VALUE_U128 }),
        fc.bigInt({ min: 0n, max: MAX_VALUE_U128 }),
        (fee, sequence) => {
          const payload = wormhole.serializeSetMessageFeeVaaPayloadToBuffer(
            ACTION_SET_MESSAGE_FEE,
            EXPECTED_CHAIN_ID,
            fee,
          );
          let body = wormhole.buildValidVaaBodySpecs({
            payload: Uint8Array.from(payload),
            emitter: wormhole.GovernanceUpdateEmitter,
            sequence,
          });
          let header = wormhole.buildValidVaaHeader(keychain, body, {
            version: 1,
            guardianSetId: 1,
          });
          let vaa = wormhole.serializeVaaToBuffer(header, body);
          const res = simnet.callPublicFn(
            contractName,
            `set-message-fee`,
            [Cl.buffer(Uint8Array.from(vaa))],
            sender,
          );
          expect(res.result).toBeOk(Cl.uint(fee));
        },
      ),
    );
  });

  it("should fail if message is replayed", () => {
    const fee = 100;
    const payload = wormhole.serializeSetMessageFeeVaaPayloadToBuffer(
      ACTION_SET_MESSAGE_FEE,
      EXPECTED_CHAIN_ID,
      fee,
    );
    let body = wormhole.buildValidVaaBodySpecs({
      payload: Uint8Array.from(payload),
      emitter: wormhole.GovernanceUpdateEmitter,
    });
    let header = wormhole.buildValidVaaHeader(keychain, body, {
      version: 1,
      guardianSetId: 1,
    });
    let vaa = wormhole.serializeVaaToBuffer(header, body);
    let res = simnet.callPublicFn(
      contractName,
      `set-message-fee`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeOk(Cl.uint(fee));
    // Submit same message again, should fail
    res = simnet.callPublicFn(
      contractName,
      `set-message-fee`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(ERR_GOV_CHECK_REPLAY));
  });
});
