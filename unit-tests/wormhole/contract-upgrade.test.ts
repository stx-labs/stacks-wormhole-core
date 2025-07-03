import { Cl } from "@stacks/transactions";
import { expect, describe, beforeEach } from "vitest";
import { it } from "@fast-check/vitest";
import { wormhole } from "./helpers";
import { hexToBytes } from "@noble/hashes/utils";
import { WormholeCore as WC, WormholeCoreProxy as WCP } from "./constants";
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
    expect(successorContractBalance).toBeUndefined;
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

    // Check we can use new contract: Set message fee to 0
    const fee = 0n;
    res = wormhole.setMessageFee(
      keychain,
      1,
      fee,
      WC.EXPECTED_CHAIN_ID,
      successorContract.name,
      sender,
    );

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

  it("should fail if `emitter.chain` is invalid", () => {
    let emitter = {
      chain: 17,
      address: wormhole.GovernanceUpdateEmitter.address,
    };
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      WC.ACTION_TRANSFER_FEES,
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
      WC.ACTION_TRANSFER_FEES,
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
