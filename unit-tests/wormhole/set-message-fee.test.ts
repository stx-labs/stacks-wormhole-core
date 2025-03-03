import { Cl } from "@stacks/transactions";
import { expect, describe, beforeEach } from "vitest";
import { it, fc } from "@fast-check/vitest";
import { wormhole } from "./helpers";
import { hexToBytes } from "@noble/hashes/utils";
import { WormholeCore as WC, MaxValue } from "./constants";

describe(`${WC.CONTRACT_NAME}::parse-and-verify-set-message-fee-payload success`, () => {
  const accounts = simnet.getAccounts();
  const action = WC.ACTION_SET_MESSAGE_FEE;
  const chain = WC.EXPECTED_CHAIN_ID;
  const sender = accounts.get("wallet_1")!;

  it("should return parsed payload", () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: MaxValue.U128 }), (fcFee) => {
        const payload = wormhole.serializeSetMessageFeeVaaPayloadToBuffer(
          action,
          chain,
          fcFee,
        );

        const res = simnet.callPublicFn(
          WC.CONTRACT_NAME,
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

describe(`${WC.CONTRACT_NAME}::parse-and-verify-set-message-fee-payload failure`, () => {
  const accounts = simnet.getAccounts();
  const sender = accounts.get("wallet_1")!;

  it("should fail if `fee` exceeds max `u128`", () => {
    const fee = MaxValue.U128 + 1n;
    const payload = wormhole.serializeSetMessageFeeVaaPayloadToBuffer(
      WC.ACTION_SET_MESSAGE_FEE,
      WC.EXPECTED_CHAIN_ID,
      fee,
    );

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-set-message-fee-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_SMF_CHECK_FEE));
  });

  it("should fail if `module` is not 'core'", () => {
    // "Dore" instead of "Core"
    const module = Buffer.from(
      "00000000000000000000000000000000000000000000000000000000446f7265",
      "hex",
    );
    const payload = wormhole.serializeSetMessageFeeVaaPayloadToBuffer(
      WC.ACTION_SET_MESSAGE_FEE,
      WC.EXPECTED_CHAIN_ID,
      100,
      module,
    );

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-set-message-fee-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_SMF_CHECK_MODULE));
  });

  it("should fail if `action` does not correspond to Wormhole SetMessageFee message", () => {
    const payload = wormhole.serializeSetMessageFeeVaaPayloadToBuffer(
      7,
      WC.EXPECTED_CHAIN_ID,
      100,
    );

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-set-message-fee-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_SMF_CHECK_ACTION));
  });

  it("should fail if `chain` does not match this chain's ID", () => {
    const payload = wormhole.serializeSetMessageFeeVaaPayloadToBuffer(
      WC.ACTION_SET_MESSAGE_FEE,
      0x3333,
      100,
    );

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-set-message-fee-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_SMF_CHECK_CHAIN));
  });

  it("should fail if payload is larger than expected", () => {
    let payload = wormhole.serializeSetMessageFeeVaaPayloadToBuffer(
      WC.ACTION_SET_MESSAGE_FEE,
      WC.EXPECTED_CHAIN_ID,
      100,
    );
    const validPayloadLen = payload.length;
    payload = Buffer.concat([Uint8Array.from(payload), new Uint8Array(1)]);
    const actualPayloadLen = payload.length;

    expect(actualPayloadLen).toBeGreaterThan(validPayloadLen);

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-set-message-fee-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_SMF_CHECK_OVERLAY));
  });

  // TODO: Payload too small
});

describe(`${WC.CONTRACT_NAME}::set-message-fee`, () => {
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
      WC.CONTRACT_NAME,
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
        fc.bigInt({ min: 0n, max: MaxValue.U128 }),
        fc.bigInt({ min: 0n, max: MaxValue.U128 }),
        (fee, sequence) => {
          const payload = wormhole.serializeSetMessageFeeVaaPayloadToBuffer(
            WC.ACTION_SET_MESSAGE_FEE,
            WC.EXPECTED_CHAIN_ID,
            fee,
          );
          const body = wormhole.buildValidVaaBodySpecs({
            payload: Uint8Array.from(payload),
            emitter: wormhole.GovernanceUpdateEmitter,
            sequence,
          });
          const header = wormhole.buildValidVaaHeader(keychain, body, {
            version: 1,
            guardianSetId: 1,
          });
          let vaa = wormhole.serializeVaaToBuffer(header, body);
          const res = simnet.callPublicFn(
            WC.CONTRACT_NAME,
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
      WC.ACTION_SET_MESSAGE_FEE,
      WC.EXPECTED_CHAIN_ID,
      fee,
    );
    const body = wormhole.buildValidVaaBodySpecs({
      payload: Uint8Array.from(payload),
      emitter: wormhole.GovernanceUpdateEmitter,
    });
    const header = wormhole.buildValidVaaHeader(keychain, body, {
      version: 1,
      guardianSetId: 1,
    });
    const vaa = wormhole.serializeVaaToBuffer(header, body);
    let res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `set-message-fee`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeOk(Cl.uint(fee));
    // Submit same message again, should fail
    res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `set-message-fee`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_GOV_CHECK_REPLAY));
  });

  it("should collect fees when `post-message` called", () => {
    // Setup message fee
    const fee = 300n;
    const numMessages = 50;
    let res = wormhole.setMessageFee(
      keychain,
      1,
      fee,
      WC.EXPECTED_CHAIN_ID,
      WC.CONTRACT_NAME,
      deployer,
    );
    expect(res.result).toBeOk(Cl.uint(fee));

    // Post message to fund contract
    const nonce = Cl.uint(0);
    const consistencyLevel = Cl.uint(0);
    const payload = Cl.buffer(new Uint8Array(1024));
    for (let i = 0; i < numMessages; i++) {
      res = simnet.callPublicFn(
        WC.CONTRACT_NAME,
        `post-message`,
        [payload, nonce, Cl.some(consistencyLevel)],
        sender,
      );
      expect(res.result).toBeOk(
        Cl.tuple({
          emitter: Cl.principal(sender),
          nonce,
          sequence: Cl.uint(i),
          "consistency-level": consistencyLevel,
          payload,
        }),
      );
    }

    // Check contract balance
    const stxBalances = simnet.getAssetsMap().get("STX")!;
    const contractPrinciple = `${deployer}.${WC.CONTRACT_NAME}`;
    const contractBalance = stxBalances.get(contractPrinciple)!;

    expect(contractBalance).toEqual(fee * BigInt(numMessages));
  });

  it("should fail if `emitter.chain` is invalid", () => {
    let emitter = {
      chain: 17,
      address: wormhole.GovernanceUpdateEmitter.address,
    };
    const payload = wormhole.serializeSetMessageFeeVaaPayloadToBuffer(
      WC.ACTION_SET_MESSAGE_FEE,
      WC.EXPECTED_CHAIN_ID,
      100,
    );
    const body = wormhole.buildValidVaaBodySpecs({
      payload: Uint8Array.from(payload),
      emitter,
    });
    const header = wormhole.buildValidVaaHeader(keychain, body, {
      version: 1,
      guardianSetId: 1,
    });
    const vaa = wormhole.serializeVaaToBuffer(header, body);
    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `set-message-fee`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_GOV_CHECK_EMITTER));
  });

  it("should fail if `emitter.address` is invalid", () => {
    let emitter = {
      chain: wormhole.GovernanceUpdateEmitter.chain,
      address: hexToBytes(
        "0000000000000000000000000000000000000000000000000000000000000009",
      ),
    };
    const payload = wormhole.serializeSetMessageFeeVaaPayloadToBuffer(
      WC.ACTION_SET_MESSAGE_FEE,
      WC.EXPECTED_CHAIN_ID,
      100,
    );
    const body = wormhole.buildValidVaaBodySpecs({
      payload: Uint8Array.from(payload),
      emitter,
    });
    const header = wormhole.buildValidVaaHeader(keychain, body, {
      version: 1,
      guardianSetId: 1,
    });
    const vaa = wormhole.serializeVaaToBuffer(header, body);
    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `set-message-fee`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_GOV_CHECK_EMITTER));
  });
});
