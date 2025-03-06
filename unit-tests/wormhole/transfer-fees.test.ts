import { Cl } from "@stacks/transactions";
import { expect, describe, beforeEach } from "vitest";
import { it, fc } from "@fast-check/vitest";
import { wormhole } from "./helpers";
import { hexToBytes } from "@noble/hashes/utils";
import {
  WormholeCore as WC,
  WormholeCoreState as WCS,
  MaxValue,
} from "./constants";

describe(`${WC.CONTRACT_NAME}::parse-and-verify-transfer-fees-payload success`, () => {
  const accounts = simnet.getAccounts();
  const action = WC.ACTION_TRANSFER_FEES;
  const chain = WC.EXPECTED_CHAIN_ID;
  const sender = accounts.get("wallet_1")!;
  const recipient = accounts.get("empty")!;

  it("should return parsed payload", () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: MaxValue.U128 }), (fcAmount) => {
        const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
          action,
          chain,
          fcAmount,
          recipient,
        );

        const res = simnet.callPublicFn(
          WC.CONTRACT_NAME,
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

describe(`${WC.CONTRACT_NAME}::parse-and-verify-transfer-fees-payload failure`, () => {
  const accounts = simnet.getAccounts();
  const sender = accounts.get("wallet_1")!;
  const recipient = accounts.get("empty")!;

  it("should fail if `amount` exceeds max `u128`", () => {
    const amount = MaxValue.U128 + 1n;
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      WC.ACTION_TRANSFER_FEES,
      WC.EXPECTED_CHAIN_ID,
      amount,
      recipient,
    );

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-transfer-fees-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_TXF_CHECK_FEE));
  });

  it("should fail if `module` is not 'core'", () => {
    // "Dore" instead of "Core"
    const module = Buffer.from(
      "00000000000000000000000000000000000000000000000000000000446f7265",
      "hex",
    );
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      WC.ACTION_TRANSFER_FEES,
      WC.EXPECTED_CHAIN_ID,
      100,
      recipient,
      module,
    );

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-transfer-fees-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_TXF_CHECK_MODULE));
  });

  it("should fail if `action` does not correspond to Wormhole TransferFee message", () => {
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      7,
      WC.EXPECTED_CHAIN_ID,
      100,
      recipient,
    );

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-transfer-fees-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_TXF_CHECK_ACTION));
  });

  it("should fail if `chain` does not match this chain's ID", () => {
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      WC.ACTION_TRANSFER_FEES,
      0x3333,
      100,
      recipient,
    );

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-transfer-fees-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_TXF_CHECK_CHAIN));
  });

  it.skip("should fail if payload is larger than expected", () => {
    let payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      WC.ACTION_TRANSFER_FEES,
      WC.EXPECTED_CHAIN_ID,
      100,
      recipient,
    );
    const validPayloadLen = payload.length;
    payload = Buffer.concat([Uint8Array.from(payload), new Uint8Array(1)]);
    const actualPayloadLen = payload.length;

    expect(actualPayloadLen).toBeGreaterThan(validPayloadLen);

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-transfer-fees-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_TXF_CHECK_OVERLAY));
  });

  // TODO: Payload too small
  // TODO: `recipient` not valid Stacks principle
});

describe(`${WC.CONTRACT_NAME}::transfer-fees`, () => {
  const accounts = simnet.getAccounts();
  const deployer = accounts.get("deployer")!;
  const sender = accounts.get("wallet_1")!;
  const recipient = accounts.get("empty")!;
  const keychain = wormhole.generateGuardianSetKeychain(19);
  const contractPrinciple = `${deployer}.${WC.CONTRACT_NAME}`;

  beforeEach(async () => {
    let res = wormhole.initializeStateContract(WC.CONTRACT_NAME, deployer);
    expect(res.result).toBeOk(Cl.bool(true));
  });

  // Before starting the test suite, we have to...
  // - Set the guardian set
  // - Set message fee rate
  // - Post a message to fund contract
  beforeEach(async () => {
    // Setup guardians
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

    // Setup message fee
    const fee = 1_000_000_000_000n;
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
        sequence: Cl.uint(0),
        "consistency-level": consistencyLevel,
        payload,
      }),
    );

    // Check contract balance
    const stxBalances = simnet.getAssetsMap().get("STX")!;
    const contractBalance = stxBalances.get(contractPrinciple)!;

    expect(contractBalance).toEqual(fee);
  });

  it("should succeed, transfer fees, and return `ok({amount, recipient})`", () => {
    let stxBalances = simnet.getAssetsMap().get("STX")!;
    const initialContractBalance = stxBalances.get(contractPrinciple)!;

    let totalAmountTransferred = 0n;
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1n, max: 100n }), // Small amounts so we don't run out
        fc.bigInt({ min: 0n, max: MaxValue.U128 }),
        (amount, sequence) => {
          const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
            WC.ACTION_TRANSFER_FEES,
            WC.EXPECTED_CHAIN_ID,
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
            WC.CONTRACT_NAME,
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
          totalAmountTransferred += amount;
        },
      ),
    );

    // Check balances
    stxBalances = simnet.getAssetsMap().get("STX")!;
    const recipientBalance = stxBalances.get(recipient)!;
    const contractBalance = stxBalances.get(contractPrinciple)!;

    expect(recipientBalance).toEqual(totalAmountTransferred);
    expect(contractBalance).toEqual(
      initialContractBalance - totalAmountTransferred,
    );
  });

  it("should fail if message is replayed", () => {
    const amount = 100n;
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      WC.ACTION_TRANSFER_FEES,
      WC.EXPECTED_CHAIN_ID,
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
      WC.CONTRACT_NAME,
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
      WC.CONTRACT_NAME,
      `transfer-fees`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WCS.ERR_STATE_VAA_REPLAYED));

    // Check recipient balance
    const stxBalances = simnet.getAssetsMap().get("STX")!;
    const recipientBalance = stxBalances.get(recipient)!;

    expect(recipientBalance).toEqual(amount);
  });

  it("should fail if core contract doesn't have the funds", () => {
    const amount = 100_000_000_000_000_000n;
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      WC.ACTION_TRANSFER_FEES,
      WC.EXPECTED_CHAIN_ID,
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
      WC.CONTRACT_NAME,
      `transfer-fees`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    // Error code from `stx-transfer?`
    expect(res.result).toBeErr(Cl.uint(1));

    // Check recipient balance
    const stxBalances = simnet.getAssetsMap().get("STX")!;
    const recipientBalance = stxBalances.get(recipient)!;

    expect(recipientBalance).toEqual(0n);
  });

  it("should fail if `emitter.chain` is invalid", () => {
    let emitter = {
      chain: 17,
      address: wormhole.GovernanceUpdateEmitter.address,
    };
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      WC.ACTION_TRANSFER_FEES,
      WC.EXPECTED_CHAIN_ID,
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
      WC.CONTRACT_NAME,
      `transfer-fees`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_GOV_CHECK_EMITTER));

    // Check recipient balance
    const stxBalances = simnet.getAssetsMap().get("STX")!;
    const recipientBalance = stxBalances.get(recipient)!;

    expect(recipientBalance).toEqual(0n);
  });

  it("should fail if `emitter.address` is invalid", () => {
    let emitter = {
      chain: wormhole.GovernanceUpdateEmitter.chain,
      address: hexToBytes(
        "0000000000000000000000000000000000000000000000000000000000000009",
      ),
    };
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      WC.ACTION_TRANSFER_FEES,
      WC.EXPECTED_CHAIN_ID,
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
      WC.CONTRACT_NAME,
      `transfer-fees`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_GOV_CHECK_EMITTER));

    // Check recipient balance
    const stxBalances = simnet.getAssetsMap().get("STX")!;
    const recipientBalance = stxBalances.get(recipient)!;

    expect(recipientBalance).toEqual(0n);
  });

  // TODO: Invalid recipient
});
