import { Cl, ClarityType } from "@stacks/transactions";
import { expect, describe, beforeEach } from "vitest";
import { it } from "@fast-check/vitest";
import { wormhole } from "./helpers";
import { tx } from "@stacks/clarinet-sdk";
import { hexToBytes } from "@noble/hashes/utils";
import {
  WormholeCore as WC,
  WormholeCoreProxy as WCP,
  WormholeCoreState as WCS,
} from "./constants";
import { keccak_256 } from "@noble/hashes/sha3";

const accounts = simnet.getAccounts();
const action = WC.ACTION_CONTRACT_UPGRADE;
const chain = WC.EXPECTED_CHAIN_ID;
const deployer = accounts.get("deployer")!;
const sender = accounts.get("wallet_1")!;

describe(`${WC.CONTRACT_NAME}::parse-contract-upgrade-payload success`, () => {
  const contract =
    "ST18JNZYRFDM14H9C8XETYJ29HMRGJDHZCQSB4X74.wormhole-core-v9000";
  const contractHash = keccak_256(contract);

  it("should return parsed payload", () => {
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      action,
      chain,
      contractHash,
    );

    const res = simnet.callPrivateFn(
      WC.CONTRACT_NAME,
      `parse-contract-upgrade-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeOk(
      Cl.tuple({
        module: Cl.buffer(Uint8Array.from(wormhole.coreModule)),
        action: Cl.uint(action),
        chain: Cl.uint(chain),
        payload: Cl.tuple({
          contract: Cl.buffer(contractHash),
        }),
      }),
    );
  });
});

describe(`${WC.CONTRACT_NAME}::parse-contract-upgrade-payload failure`, () => {
  const contract = "ST18JNZYRFDM14H9C8XETYJ29HMRGJDHZCQSB4X74.wormhole-core-v7";

  it("should fail if `module` is not 'core'", () => {
    // "Dore" instead of "Core"
    const module = Buffer.from(
      "00000000000000000000000000000000000000000000000000000000446f7265",
      "hex",
    );
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      WC.ACTION_CONTRACT_UPGRADE,
      WC.EXPECTED_CHAIN_ID,
      contract,
      module,
    );

    const res = simnet.callPrivateFn(
      WC.CONTRACT_NAME,
      `parse-contract-upgrade-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_GOV_CHECK_MODULE));
  });

  it("should fail if `action` does not correspond to Wormhole ContractUpgrade message", () => {
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      14,
      WC.EXPECTED_CHAIN_ID,
      contract,
    );

    const res = simnet.callPrivateFn(
      WC.CONTRACT_NAME,
      `parse-contract-upgrade-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_GOV_CHECK_ACTION));
  });

  it("should fail if `chain` does not match this chain's ID", () => {
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      WC.ACTION_CONTRACT_UPGRADE,
      0x3333,
      contract,
    );

    const res = simnet.callPrivateFn(
      WC.CONTRACT_NAME,
      `parse-contract-upgrade-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_GOV_CHECK_CHAIN));
  });

  // Can't test this using Wormhole addresses
  it.skip("should fail if `contract` address does not match this network", () => {
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      WC.ACTION_CONTRACT_UPGRADE,
      WC.EXPECTED_CHAIN_ID,
      "SP3NG7N03QKACBR7AWTPK79ZV86RAKXKDEH4BVF2B.wormhole-core-v5",
    );

    const res = simnet.callPrivateFn(
      WC.CONTRACT_NAME,
      `parse-contract-upgrade-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_UPG_CHECK_CONTRACT_ADDRESS));
  });

  // Can't test this using Wormhole addresses
  it.skip("should fail if `contract` address is a standard principal", () => {
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      WC.ACTION_CONTRACT_UPGRADE,
      WC.EXPECTED_CHAIN_ID,
      "ST1EYXDYXB4DD7WJC1QS7GZC35NT5CG35QSCZ08Q2",
    );

    const res = simnet.callPrivateFn(
      WC.CONTRACT_NAME,
      `parse-contract-upgrade-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_UPG_CHECK_CONTRACT_ADDRESS));
  });

  it("should fail if payload is larger than expected", () => {
    let payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      WC.ACTION_CONTRACT_UPGRADE,
      WC.EXPECTED_CHAIN_ID,
      contract,
    );
    const validPayloadLen = payload.length;
    payload = Buffer.concat([Uint8Array.from(payload), new Uint8Array(1)]);
    const actualPayloadLen = payload.length;

    expect(actualPayloadLen).toBeGreaterThan(validPayloadLen);

    const res = simnet.callPrivateFn(
      WC.CONTRACT_NAME,
      `parse-contract-upgrade-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_UPG_CHECK_OVERLAY));
  });
});

describe(`${WC.CONTRACT_NAME}::contract-upgrade`, () => {
  const contractPrinciple = `${deployer}.${WC.CONTRACT_NAME}`;
  const keychain = wormhole.generateGuardianSetKeychain(19);
  const postMessageFee = 1_000_000_000_000n;

  const successorContract = {
    name: "wormhole-core-successor",
    deployer,
    async code() {
      const fs = require("fs/promises");
      return await fs.readFile(`contracts/${WC.CONTRACT_NAME}.clar`, "utf8");
    },
    principal() {
      return `${this.deployer}.wormhole-core-successor`;
    },
    wormholeAddress() {
      return keccak_256(this.principal());
    },
  };

  // Before starting the test suite, we have to...
  // - Initialize state contract
  // - Set the guardian set
  // - Set message fee rate
  // - Post a message to fund contract
  beforeEach(async () => {
    // Initialize state contract
    let res = wormhole.initializeStateContract(WC.CONTRACT_NAME, deployer);
    expect(res.result).toBeOk(Cl.bool(true));

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
    res = wormhole.setMessageFee(
      keychain,
      1,
      postMessageFee,
      WC.EXPECTED_CHAIN_ID,
      WC.CONTRACT_NAME,
      deployer,
    );
    expect(res.result).toBeOk(Cl.uint(postMessageFee));

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
    const stxBalances = simnet.getAssetsMap().get("STX")!;
    const contractBalance = stxBalances.get(contractPrinciple)!;
    const successorContractBalance = stxBalances.get(
      successorContract.principal(),
    )!;

    expect(contractBalance).toEqual(postMessageFee);
    expect(successorContractBalance).toBeUndefined();
  });

  it("should upgrade to new contract and disable old contract", async () => {
    // Publish successor contract
    let res = simnet.deployContract(
      successorContract.name,
      await successorContract.code(),
      null,
      deployer,
    );
    expect(res.result).toBeBool(true);

    // Construct and send ContractUpgrade VAA
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      WC.ACTION_CONTRACT_UPGRADE,
      WC.EXPECTED_CHAIN_ID,
      successorContract.principal(),
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
    res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      "contract-upgrade",
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeOk(Cl.buffer(successorContract.wormholeAddress()));

    // Finish upgrade by initializing new contract
    res = simnet.callPublicFn(
      successorContract.name,
      "initialize",
      [Cl.some(Cl.principal(`${deployer}.${WC.CONTRACT_NAME}`))],
      sender,
    );
    expect(res.result).toBeOk(Cl.bool(true));

    // Check STX balance was transferred
    const stxBalances = simnet.getAssetsMap().get("STX")!;
    const contractBalance = stxBalances.get(contractPrinciple)!;
    const successorContractBalance = stxBalances.get(
      successorContract.principal(),
    )!;

    expect(contractBalance).toEqual(0n);
    expect(successorContractBalance).toEqual(postMessageFee);

    // Check old contract deployment is not active
    res = simnet.callReadOnlyFn(
      WC.CONTRACT_NAME,
      "is-active-deployment",
      [],
      sender,
    );
    expect(res.result).toEqual(Cl.bool(false));

    // Check new contract deployment is active
    res = simnet.callReadOnlyFn(
      successorContract.name,
      "is-active-deployment",
      [],
      sender,
    );
    expect(res.result).toEqual(Cl.bool(true));

    // Check state owner changed
    res = simnet.callReadOnlyFn(
      "wormhole-core-state",
      "get-active-wormhole-core-contract",
      [],
      sender,
    );
    expect(res.result).toEqual(
      Cl.some(Cl.principal(successorContract.principal())),
    );

    // Check we can use new contract: Set message fee to minimum
    const fee = BigInt(WC.MINIMUM_MESSAGE_FEE);
    res = wormhole.setMessageFee(
      keychain,
      1,
      fee,
      WC.EXPECTED_CHAIN_ID,
      successorContract.name,
      sender,
    );
    expect(res.result).toBeOk(Cl.uint(fee));

    // Check we can use new contract: Post a message and check sequence number
    const nonce = Cl.uint(0);
    const message = Cl.buffer(
      Uint8Array.from(Buffer.from("48656C6C6F20576F726C6421", "hex")), // "Hello World!" in ASCII
    );
    res = simnet.callPublicFn(
      successorContract.name,
      "post-message",
      [message, nonce, Cl.none()],
      sender,
    );
    expect(res.result).toBeOk(
      Cl.tuple({
        "emitter-principal": Cl.principal(sender),
        emitter: Cl.buffer(keccak_256(sender)),
        nonce,
        sequence: Cl.uint(1), // This is the second call to `post-message` by this sender
        "consistency-level": Cl.uint(WC.DEFAULT_CONSISTENCY_LEVEL),
        payload: message,
      }),
    );

    // Check we can NOT use old contract: Posting message should fail
    res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      "post-message",
      [message, nonce, Cl.none()],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_DEPLOYMENT_STATE_NOT_ACTIVE));
  });

  it("should be accessible via proxy before and after update", async () => {
    // Check proxy before update
    let expectedSequence = 1;
    const nonce = Cl.uint(0);
    const message = Cl.buffer(
      Uint8Array.from(Buffer.from("48656C6C6F20576F726C6421", "hex")), // "Hello World!" in ASCII
    );
    let res = simnet.callPublicFn(
      WCP.CONTRACT_NAME,
      "post-message",
      [Cl.principal(contractPrinciple), message, nonce, Cl.none()],
      sender,
    );
    expect(res.result).toBeOk(
      Cl.tuple({
        "emitter-principal": Cl.principal(sender),
        emitter: Cl.buffer(keccak_256(sender)),
        nonce,
        sequence: Cl.uint(expectedSequence++), // This is the second call to `post-message` by this sender
        "consistency-level": Cl.uint(WC.DEFAULT_CONSISTENCY_LEVEL),
        payload: message,
      }),
    );
    // Publish successor contract
    res = simnet.deployContract(
      successorContract.name,
      await successorContract.code(),
      null,
      deployer,
    );
    expect(res.result).toBeBool(true);

    // Construct and send ContractUpgrade VAA
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      WC.ACTION_CONTRACT_UPGRADE,
      WC.EXPECTED_CHAIN_ID,
      successorContract.principal(),
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
    res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      "contract-upgrade",
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeOk(Cl.buffer(successorContract.wormholeAddress()));

    // Finish upgrade by initializing new contract
    res = simnet.callPublicFn(
      successorContract.name,
      "initialize",
      [Cl.some(Cl.principal(`${deployer}.${WC.CONTRACT_NAME}`))],
      sender,
    );
    expect(res.result).toBeOk(Cl.bool(true));

    // Should be able to make same call as before via proxy
    res = simnet.callPublicFn(
      WCP.CONTRACT_NAME,
      "post-message",
      [Cl.principal(successorContract.principal()), message, nonce, Cl.none()],
      sender,
    );
    expect(res.result).toBeOk(
      Cl.tuple({
        "emitter-principal": Cl.principal(sender),
        emitter: Cl.buffer(keccak_256(sender)),
        nonce,
        sequence: Cl.uint(expectedSequence++), // This is the second call to `post-message` by this sender
        "consistency-level": Cl.uint(WC.DEFAULT_CONSISTENCY_LEVEL),
        payload: message,
      }),
    );
  });

  it("should fail if message is replayed", async () => {
    // Publish successor contract
    let res = simnet.deployContract(
      successorContract.name,
      await successorContract.code(),
      null,
      deployer,
    );
    expect(res.result).toBeBool(true);

    // Construct and send ContractUpgrade VAA
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      WC.ACTION_CONTRACT_UPGRADE,
      WC.EXPECTED_CHAIN_ID,
      successorContract.principal(),
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
    res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      "contract-upgrade",
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeOk(Cl.buffer(successorContract.wormholeAddress()));

    // Should fail second time
    res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      "contract-upgrade",
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WCS.ERR_STATE_VAA_REPLAYED));
  });

  it("should fail if `emitter.chain` is invalid", () => {
    let emitter = {
      chain: 17,
      address: wormhole.GovernanceUpdateEmitter.address,
    };
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      WC.ACTION_CONTRACT_UPGRADE,
      WC.EXPECTED_CHAIN_ID,
      successorContract.principal(),
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
      "contract-upgrade",
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
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      WC.ACTION_CONTRACT_UPGRADE,
      WC.EXPECTED_CHAIN_ID,
      successorContract.principal(),
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
      "contract-upgrade",
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_GOV_CHECK_EMITTER));
  });
});

describe(`${WC.CONTRACT_NAME}::contract-upgrade with old guardian set`, () => {
  const guardianSet1Keys = wormhole.generateGuardianSetKeychain(19);
  const guardianSet2Keys = wormhole.generateGuardianSetKeychain(19);

  beforeEach(async () => {
    let res = wormhole.initializeStateContract(WC.CONTRACT_NAME, deployer);
    expect(res.result).toBeOk(Cl.bool(true));

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
    const uncompressedPublicKey = guardianSet2Keys.map((g) =>
      Cl.buffer(g.uncompressedPublicKey),
    );
    simnet.mineBlock([
      tx.callPublicFn(
        WC.CONTRACT_NAME,
        "guardian-set-upgrade",
        [Cl.buffer(Uint8Array.from(vaa)), Cl.list(uncompressedPublicKey)],
        sender,
      ),
    ]);
  });

  it("should fail contract-upgrade if signed by old guardian set (ERR_GOV_VAA_OLD_GUARDIAN_SET)", () => {
    const successor = `${deployer}.wormhole-core-v999`;
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      WC.ACTION_CONTRACT_UPGRADE,
      WC.EXPECTED_CHAIN_ID,
      successor,
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
      "contract-upgrade",
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_GOV_VAA_OLD_GUARDIAN_SET));
  });
});

describe(`${WC.CONTRACT_NAME}::operations blocked after contract upgrade`, () => {
  const keychain = wormhole.generateGuardianSetKeychain(19);
  const contractPrinciple = `${deployer}.${WC.CONTRACT_NAME}`;
  const postMessageFee = 1_000_000n;

  const successorContract = {
    name: "wormhole-core-successor-2",
    async code() {
      const fs = require("fs/promises");
      return await fs.readFile(`contracts/${WC.CONTRACT_NAME}.clar`, "utf8");
    },
    principal() {
      return `${deployer}.wormhole-core-successor-2`;
    },
    wormholeAddress() {
      return keccak_256(this.principal());
    },
  };

  beforeEach(async () => {
    // Initialize state
    let res = wormhole.initializeStateContract(WC.CONTRACT_NAME, deployer);
    expect(res.result).toBeOk(Cl.bool(true));

    // Setup guardians
    wormhole.applyGuardianSetUpdate(keychain, 1, deployer, WC.CONTRACT_NAME);

    // Set message fee
    res = wormhole.setMessageFee(
      keychain,
      1,
      postMessageFee,
      WC.EXPECTED_CHAIN_ID,
      WC.CONTRACT_NAME,
      deployer,
    );
    expect(res.result).toBeOk(Cl.uint(postMessageFee));

    // Post a message to fund the contract
    res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      "post-message",
      [Cl.buffer(new Uint8Array(32)), Cl.uint(0), Cl.none()],
      sender,
    );
    expect(res.result).toHaveClarityType(ClarityType.ResponseOk);

    // Deploy and upgrade to successor
    res = simnet.deployContract(
      successorContract.name,
      await successorContract.code(),
      null,
      deployer,
    );
    expect(res.result).toBeBool(true);

    // Send ContractUpgrade VAA
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      WC.ACTION_CONTRACT_UPGRADE,
      WC.EXPECTED_CHAIN_ID,
      successorContract.principal(),
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
    res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      "contract-upgrade",
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeOk(Cl.buffer(successorContract.wormholeAddress()));

    // Finalize upgrade
    res = simnet.callPublicFn(
      successorContract.name,
      "initialize",
      [Cl.some(Cl.principal(contractPrinciple))],
      sender,
    );
    expect(res.result).toBeOk(Cl.bool(true));
  });

  it("should fail set-message-fee on deprecated contract", () => {
    const fee = 500n;
    const payload = wormhole.serializeSetMessageFeeVaaPayloadToBuffer(
      WC.ACTION_SET_MESSAGE_FEE,
      WC.EXPECTED_CHAIN_ID,
      fee,
    );
    const body = wormhole.buildValidVaaBodySpecs({
      payload: Uint8Array.from(payload),
      emitter: wormhole.GovernanceUpdateEmitter,
      sequence: 50n,
    });
    const header = wormhole.buildValidVaaHeader(keychain, body, {
      version: 1,
      guardianSetId: 1,
    });
    const vaa = wormhole.serializeVaaToBuffer(header, body);

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      "set-message-fee",
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_DEPLOYMENT_STATE_NOT_ACTIVE));
  });

  it("should fail transfer-fees on deprecated contract", () => {
    const recipient = accounts.get("wallet_2")!;
    const recipientHash = keccak_256(recipient);

    // Register recipient on successor since it's now the owner
    simnet.callPublicFn(
      "addr32",
      "register",
      [Cl.principal(recipient)],
      sender,
    );

    const payload = wormhole.serializeTransferFeesVaaPayloadToBuffer(
      WC.ACTION_TRANSFER_FEES,
      WC.EXPECTED_CHAIN_ID,
      100,
      recipientHash,
    );
    const body = wormhole.buildValidVaaBodySpecs({
      payload: Uint8Array.from(payload),
      emitter: wormhole.GovernanceUpdateEmitter,
      sequence: 50n,
    });
    const header = wormhole.buildValidVaaHeader(keychain, body, {
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
    expect(res.result).toBeErr(Cl.uint(WC.ERR_DEPLOYMENT_STATE_NOT_ACTIVE));
  });

  it("should fail guardian-set-upgrade on deprecated contract", () => {
    const newKeychain = wormhole.generateGuardianSetKeychain(19);
    const guardianRotationPayload =
      wormhole.serializeGuardianUpdateVaaPayloadToBuffer(
        newKeychain,
        2,
        0,
        2,
        wormhole.validGuardianRotationModule,
      );
    const body = wormhole.buildValidVaaBodySpecs({
      payload: Uint8Array.from(guardianRotationPayload),
      emitter: wormhole.GovernanceUpdateEmitter,
      sequence: 50n,
    });
    const header = wormhole.buildValidVaaHeader(keychain, body, {
      version: 1,
      guardianSetId: 1,
    });
    const vaa = wormhole.serializeVaaToBuffer(header, body);
    const uncompressedPublicKey = newKeychain.map((g) =>
      Cl.buffer(g.uncompressedPublicKey),
    );

    const res = simnet.mineBlock([
      tx.callPublicFn(
        WC.CONTRACT_NAME,
        "guardian-set-upgrade",
        [Cl.buffer(Uint8Array.from(vaa)), Cl.list(uncompressedPublicKey)],
        sender,
      ),
    ])[0].result;
    expect(res).toBeErr(Cl.uint(WC.ERR_DEPLOYMENT_STATE_NOT_ACTIVE));
  });

  it("should fail contract-upgrade on deprecated contract", () => {
    const successor2 = `${deployer}.wormhole-core-v9999`;
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      WC.ACTION_CONTRACT_UPGRADE,
      WC.EXPECTED_CHAIN_ID,
      successor2,
    );
    const body = wormhole.buildValidVaaBodySpecs({
      payload: Uint8Array.from(payload),
      emitter: wormhole.GovernanceUpdateEmitter,
      sequence: 50n,
    });
    const header = wormhole.buildValidVaaHeader(keychain, body, {
      version: 1,
      guardianSetId: 1,
    });
    const vaa = wormhole.serializeVaaToBuffer(header, body);

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      "contract-upgrade",
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_DEPLOYMENT_STATE_NOT_ACTIVE));
  });

  it("should fail protocol-agnostic-send on deprecated contract", () => {
    const payload = new Uint8Array(32);

    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      "protocol-agnostic-send",
      [
        Cl.buffer(payload),
        Cl.none(),
        Cl.none(),
        Cl.some(Cl.uint(1)),
        Cl.none(),
      ],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_DEPLOYMENT_STATE_NOT_ACTIVE));
  });
});
