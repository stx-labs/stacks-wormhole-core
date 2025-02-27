import { Cl } from "@stacks/transactions";
import { expect, describe, beforeEach } from "vitest";
import { it, fc } from "@fast-check/vitest";
import { wormhole } from "./helpers";
import { hexToBytes } from "@noble/hashes/utils";

const MAX_VALUE_U128 = 340282366920938463463374607431768211455n;

// Constants from `wormhole-core`
const ACTION_TRANSFER_FEES = 4;
const ERR_TXF_CHECK_OVERLAY = 1607;
const ERR_TXF_CHECK_FEE = 1608;
const ERR_TXF_CHECK_MODULE = 1609;
const ERR_TXF_CHECK_ACTION = 1610;
const ERR_TXF_CHECK_CHAIN = 1611;
const ERR_GOV_CHECK_EMITTER = 1701;
const ERR_GOV_CHECK_REPLAY = 1701;
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

  it("should fail if `chain` does not match this chain's ID", () => {
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

describe(`${contractName}::transfer-fees`, () => {
  const accounts = simnet.getAccounts();
  const deployer = accounts.get("deployer")!;
  const sender = accounts.get("wallet_1")!;
  const recipient = accounts.get("wallet_2")!;
  const keychain = wormhole.generateGuardianSetKeychain(19);

  // Before starting the test suite, we have to...
  // - Setup the guardian set.
  // - Set message fee rate
  // - Emit a message to fund contract
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

  it.skip("should succeed and return `ok({amount, recipient})`", () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1n, max: 100n }),
        fc.bigInt({ min: 0n, max: MAX_VALUE_U128 }),
        (amount, sequence) => {
          const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
            ACTION_TRANSFER_FEES,
            EXPECTED_CHAIN_ID,
            amount,
            recipient,
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
            contractName,
            `transfer-fees`,
            [Cl.buffer(Uint8Array.from(vaa))],
            sender,
          );
          expect(res.result).toBeOk(
            Cl.tuple({
              amount: Cl.uint(amount),
              recipient: Cl.principal(recipient),
            }),
          );
        },
      ),
    );
  });

  it.skip("should fail if message is replayed", () => {
    const amount = 100;
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      ACTION_TRANSFER_FEES,
      EXPECTED_CHAIN_ID,
      amount,
      recipient,
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
      contractName,
      `transfer-fees`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeOk(
      Cl.tuple({
        amount: Cl.uint(amount),
        recipient: Cl.principal(recipient),
      }),
    );
    // Submit same message again, should fail
    res = simnet.callPublicFn(
      contractName,
      `transfer-fees`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(ERR_GOV_CHECK_REPLAY));
  });

  it("should fail if core contract doesn't have the funds", () => {
    const amount = 100_000_000_000_000_000n;
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      ACTION_TRANSFER_FEES,
      EXPECTED_CHAIN_ID,
      amount,
      recipient,
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
    const res = simnet.callPublicFn(
      contractName,
      `transfer-fees`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    // Error code from `stx-transfer?`
    expect(res.result).toBeErr(Cl.uint(4));
  });

  it("should fail if `emitter.chain` is invalid", () => {
    let emitter = {
      chain: 17,
      address: wormhole.GovernanceUpdateEmitter.address,
    };
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      ACTION_TRANSFER_FEES,
      EXPECTED_CHAIN_ID,
      100,
      recipient,
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
      contractName,
      `transfer-fees`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(ERR_GOV_CHECK_EMITTER));
  });

  it("should fail if `emitter.address` is invalid", () => {
    let emitter = {
      chain: wormhole.GovernanceUpdateEmitter.chain,
      address: hexToBytes(
        "0000000000000000000000000000000000000000000000000000000000000009",
      ),
    };
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      ACTION_TRANSFER_FEES,
      EXPECTED_CHAIN_ID,
      100,
      recipient,
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
      contractName,
      `transfer-fees`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(ERR_GOV_CHECK_EMITTER));
  });

  // TODO: Invalid recipient
});
