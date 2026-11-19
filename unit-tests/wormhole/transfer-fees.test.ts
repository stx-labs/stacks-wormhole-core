import { it, fc } from "@fast-check/vitest";
import { hexToBytes } from "@noble/hashes/utils";
import {
  WormholeCore as WC,
  WormholeCoreState as WCS,
  Addr32,
  MaxValue,
} from "./constants";
import { keccak_256 } from "@noble/hashes/sha3";
import { Cl } from "@stacks/transactions";
import { tx } from "@stacks/clarinet-sdk";
import { default as objectHash } from "object-hash";
import { expect, describe, beforeEach } from "vitest";

import { wormhole } from "./helpers";

const accounts = simnet.getAccounts();
const action = WC.ACTION_TRANSFER_FEES;
const chain = WC.EXPECTED_CHAIN_ID;
const deployer = accounts.get("deployer")!;
const sender = accounts.get("wallet_1")!;
const recipient = accounts.get("empty")!;
const recipientHash = keccak_256(recipient);
const keychain = wormhole.generateGuardianSetKeychain(19);
const contractPrinciple = `${deployer}.${WC.CONTRACT_NAME}`;

function registerWormholeAddress(stacksAddress: string) {
  const hash = keccak_256(stacksAddress);
  const res = simnet.callPublicFn(
    Addr32.CONTRACT_NAME,
    "register",
    [Cl.principal(stacksAddress)],
    sender,
  );
  expect(res.result).toBeOk(
    Cl.tuple({
      created: Cl.bool(true),
      addr32: Cl.buffer(hash),
    }),
  );
}

describe(`${WC.CONTRACT_NAME}::parse-transfer-fees-payload success`, () => {
  beforeEach(() => {
    // Initialize state contract
    let res = wormhole.initializeStateContract(WC.CONTRACT_NAME, deployer);
    expect(res.result).toBeOk(Cl.bool(true));

    registerWormholeAddress(recipient);
  });

  it("should return parsed payload", () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: MaxValue.U128 }), (fcAmount) => {
        const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
          action,
          chain,
          fcAmount,
          recipientHash,
        );

        const res = simnet.callPrivateFn(
          WC.CONTRACT_NAME,
          `parse-transfer-fees-payload`,
          [Cl.buffer(Uint8Array.from(payload))],
          sender,
        );
        expect(res.result).toBeOk(
          Cl.tuple({
            module: Cl.buffer(Uint8Array.from(wormhole.coreModule)),
            action: Cl.uint(action),
            chain: Cl.uint(chain),
            payload: Cl.tuple({
              amount: Cl.uint(fcAmount),
              recipient: Cl.principal(recipient),
            }),
          }),
        );
      }),
    );
  });
});

describe(`${WC.CONTRACT_NAME}::parse-transfer-fees-payload failure`, () => {
  beforeEach(() => {
    // Initialize state contract
    let res = wormhole.initializeStateContract(WC.CONTRACT_NAME, deployer);
    expect(res.result).toBeOk(Cl.bool(true));

    registerWormholeAddress(recipient);
  });

  it("should fail if `amount` exceeds max `u128`", () => {
    const amount = MaxValue.U128 + 1n;
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      WC.ACTION_TRANSFER_FEES,
      WC.EXPECTED_CHAIN_ID,
      amount,
      recipientHash,
    );

    const res = simnet.callPrivateFn(
      WC.CONTRACT_NAME,
      `parse-transfer-fees-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_TXF_CHECK_AMOUNT));
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
      recipientHash,
      module,
    );

    const res = simnet.callPrivateFn(
      WC.CONTRACT_NAME,
      `parse-transfer-fees-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_GOV_CHECK_MODULE));
  });

  it("should fail if `action` does not correspond to Wormhole TransferFee message", () => {
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      7,
      WC.EXPECTED_CHAIN_ID,
      100,
      recipientHash,
    );

    const res = simnet.callPrivateFn(
      WC.CONTRACT_NAME,
      `parse-transfer-fees-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_GOV_CHECK_ACTION));
  });

  it("should fail if `chain` does not match this chain's ID", () => {
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      WC.ACTION_TRANSFER_FEES,
      0x3333,
      100,
      recipientHash,
    );

    const res = simnet.callPrivateFn(
      WC.CONTRACT_NAME,
      `parse-transfer-fees-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_GOV_CHECK_CHAIN));
  });

  // No point in checking this now that we use address hashes in Wormhole messaging
  it.skip("should fail if `recipient` address does not match this network", () => {
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      WC.ACTION_TRANSFER_FEES,
      WC.EXPECTED_CHAIN_ID,
      100,
      "SPE6SKFFBSW9ASG6SNPG31T4NA1QEY3GJ96TK6TF",
    );

    const res = simnet.callPrivateFn(
      WC.CONTRACT_NAME,
      `parse-transfer-fees-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_TXF_CHECK_RECIPIENT_ADDRESS));
  });

  it("should fail if `recipient` address is not registered", () => {
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      WC.ACTION_TRANSFER_FEES,
      WC.EXPECTED_CHAIN_ID,
      100,
      "STXY4E4D52A93ZBWVJ89617YC7TSPVJJ2RD5W49M",
    );

    const res = simnet.callPrivateFn(
      WC.CONTRACT_NAME,
      `parse-transfer-fees-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_TXF_LOOKUP_RECIPIENT_ADDRESS));
  });

  it("should fail if payload is larger than expected", () => {
    let payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      WC.ACTION_TRANSFER_FEES,
      WC.EXPECTED_CHAIN_ID,
      100,
      recipientHash,
    );
    const validPayloadLen = payload.length;
    payload = Buffer.concat([Uint8Array.from(payload), new Uint8Array(1)]);
    const actualPayloadLen = payload.length;

    expect(actualPayloadLen).toBeGreaterThan(validPayloadLen);

    const res = simnet.callPrivateFn(
      WC.CONTRACT_NAME,
      `parse-transfer-fees-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_TXF_CHECK_OVERLAY));
  });

  it("should fail if payload is smaller than expected", () => {
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      WC.ACTION_TRANSFER_FEES,
      WC.EXPECTED_CHAIN_ID,
      100,
      recipientHash,
    );
    const payloadLen = payload.length;
    const payloadSubarray = payload.subarray(0, payloadLen - 1);

    expect(payloadSubarray.length).toBeLessThan(payloadLen);

    const res = simnet.callPrivateFn(
      WC.CONTRACT_NAME,
      `parse-transfer-fees-payload`,
      [Cl.buffer(Uint8Array.from(payloadSubarray))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_TXF_PARSING_RECIPIENT));
  });
});

describe(`${WC.CONTRACT_NAME}::transfer-fees`, () => {
  // Before starting the test suite, we have to...
  // - Initialize state contract
  // - Register recipient's Wormhole address
  // - Set the guardian set
  // - Set message fee rate
  // - Post a message to fund contract
  beforeEach(async () => {
    // Initialize state contract
    let res = wormhole.initializeStateContract(WC.CONTRACT_NAME, deployer);
    expect(res.result).toBeOk(Cl.bool(true));

    // Register recipient's Wormhole address
    registerWormholeAddress(recipient);

    // Setup guardians
    let [result, vaaHeader, vaaBody] = wormhole.applyGuardianSetUpdate(
      keychain,
      1,
      deployer,
      WC.CONTRACT_NAME,
    );
    const decodedVaa = wormhole.serializeVaaToClarityValue(
      vaaHeader as wormhole.VaaHeader,
      vaaBody as wormhole.VaaBody,
    );

    expect(result).toBeOk(
      Cl.tuple({
        result: Cl.tuple({
          "guardians-eth-addresses": Cl.list(
            keychain.map((g) => Cl.buffer(g.ethereumAddress)),
          ),
        }),
        vaa: decodedVaa,
      }),
    );

    // Setup message fee
    const fee = 1_000_000_000_000n;
    res = wormhole.setMessageFee(
      keychain,
      1,
      fee,
      WC.EXPECTED_CHAIN_ID,
      WC.CONTRACT_NAME,
      deployer,
    );
    expect(res.result).toBeOk(Cl.uint(fee));

    // Check contract balance
    const stxBalances = () => simnet.getAssetsMap().get("STX");
    const initialContractBalance = stxBalances()!.get(contractPrinciple) ?? 0n;

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
        "emitter-principal": Cl.principal(sender),
        emitter: Cl.buffer(keccak_256(sender)),
        nonce,
        sequence: Cl.uint(0),
        "consistency-level": consistencyLevel,
        payload,
      }),
    );

    // Check contract balance
    const contractBalance = stxBalances()!.get(contractPrinciple) ?? 0n;

    expect(contractBalance).toEqual(initialContractBalance + fee);
  });

  it("should succeed, transfer fees, and return `ok({amount, recipient})`", () => {
    let stxBalances = simnet.getAssetsMap().get("STX")!;
    const initialContractBalance = stxBalances.get(contractPrinciple)!;

    // Using same parameters more than once will result in identical VAA and cause failure
    // In this case, we should expect that `transfer-fees` fails
    const usedParams = new Set();
    let totalAmountTransferred = 0n;
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1n, max: 100n }), // Small amounts so we don't run out
        fc.bigInt({ min: 0n, max: MaxValue.U64 }),
        (amount, sequence) => {
          const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
            WC.ACTION_TRANSFER_FEES,
            WC.EXPECTED_CHAIN_ID,
            amount,
            recipientHash,
          );
          const body = wormhole.buildValidVaaBodySpecs({
            payload: Uint8Array.from(payload),
            emitter: wormhole.GovernanceUpdateEmitter,
            sequence,
            timestamp: 0, // Repeated inputs must produce the same signed body.
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

          // Detect reused params (which result in identical VAA) and expect error
          const params = objectHash({ amount, sequence });
          if (usedParams.has(params)) {
            expect(res.result).toBeErr(Cl.uint(WCS.ERR_STATE_VAA_REPLAYED));
            return;
          }

          // Params are unique, so expect transfer to have succeeded
          expect(res.result).toBeOk(
            Cl.tuple({
              amount: Cl.uint(amount),
              recipient: Cl.principal(recipient),
            }),
          );
          totalAmountTransferred += amount;
          usedParams.add(params);
        },
      ),
      // Exercise distinct sequences and an exact replay on every run.
      { examples: [[1n, 0n], [1n, 1n], [1n, 0n]] },
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
      recipientHash,
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
      recipientHash,
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
      recipientHash,
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
      recipientHash,
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
});

describe(`${WC.CONTRACT_NAME}::transfer-fees with old guardian set`, () => {
  const guardianSet1Keys = wormhole.generateGuardianSetKeychain(19);
  const guardianSet2Keys = wormhole.generateGuardianSetKeychain(19);

  beforeEach(async () => {
    let res = wormhole.initializeStateContract(WC.CONTRACT_NAME, deployer);
    expect(res.result).toBeOk(Cl.bool(true));

    // Register recipient
    registerWormholeAddress(recipient);

    // Setup guardian set 1
    wormhole.applyGuardianSetUpdate(
      guardianSet1Keys,
      1,
      deployer,
      WC.CONTRACT_NAME,
    );

    // Upgrade to guardian set 2
    const guardianRotationPayload =
      wormhole.serializeGuardianUpdateVaaPayloadToBuffer(
        guardianSet2Keys,
        2,
        0,
        2,
        wormhole.validGuardianRotationModule,
      );
    const body = wormhole.buildValidVaaBodySpecs({
      payload: Uint8Array.from(guardianRotationPayload),
      emitter: wormhole.GovernanceUpdateEmitter,
    });
    const header = wormhole.buildValidVaaHeader(guardianSet1Keys, body, {
      version: 1,
      guardianSetId: 1,
    });
    const vaa = wormhole.serializeVaaToBuffer(header, body);
    simnet.mineBlock([
      tx.callPublicFn(
        WC.CONTRACT_NAME,
        "guardian-set-upgrade",
        [Cl.buffer(Uint8Array.from(vaa))],
        sender,
      ),
    ]);
  });

  it("should fail transfer-fees if signed by old guardian set (ERR_GOV_VAA_OLD_GUARDIAN_SET)", () => {
    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      WC.ACTION_TRANSFER_FEES,
      WC.EXPECTED_CHAIN_ID,
      100,
      recipientHash,
    );
    const body = wormhole.buildValidVaaBodySpecs({
      payload: Uint8Array.from(payload),
      emitter: wormhole.GovernanceUpdateEmitter,
      sequence: 99n,
    });
    const header = wormhole.buildValidVaaHeader(guardianSet1Keys, body, {
      version: 1,
      guardianSetId: 1,
    });
    const vaa = wormhole.serializeVaaToBuffer(header, body);

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      "transfer-fees",
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_GOV_VAA_OLD_GUARDIAN_SET));
  });
});
