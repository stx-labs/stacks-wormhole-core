import { Cl } from "@stacks/transactions";
import { expect, describe, beforeEach } from "vitest";
import { it } from "@fast-check/vitest";
import { wormhole } from "./helpers";
import { hexToBytes } from "@noble/hashes/utils";
import { WormholeCore as WC } from "./constants";

describe(`${WC.CONTRACT_NAME}::parse-and-verify-contract-upgrade-payload success`, () => {
  const accounts = simnet.getAccounts();
  const action = WC.ACTION_CONTRACT_UPGRADE;
  const chain = WC.EXPECTED_CHAIN_ID;
  const sender = accounts.get("wallet_1")!;
  const contract =
    "ST18JNZYRFDM14H9C8XETYJ29HMRGJDHZCQSB4X74.wormhole-core-v9000";

  it("should return parsed payload", () => {
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      action,
      chain,
      contract,
    );

    const res = simnet.callReadOnlyFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-contract-upgrade-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeOk(
      Cl.tuple({
        module: Cl.buffer(Uint8Array.from(wormhole.coreModule)),
        action: Cl.uint(action),
        contract: Cl.principal(contract),
        chain: Cl.uint(chain),
      }),
    );
  });
});

describe(`${WC.CONTRACT_NAME}::parse-and-verify-contract-upgrade-payload failure`, () => {
  const accounts = simnet.getAccounts();
  const sender = accounts.get("wallet_1")!;
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

    const res = simnet.callReadOnlyFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-contract-upgrade-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_UPG_CHECK_MODULE));
  });

  it("should fail if `action` does not correspond to Wormhole ContractUpgrade message", () => {
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      14,
      WC.EXPECTED_CHAIN_ID,
      contract,
    );

    const res = simnet.callReadOnlyFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-contract-upgrade-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_UPG_CHECK_ACTION));
  });

  it("should fail if `chain` does not match this chain's ID", () => {
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      WC.ACTION_CONTRACT_UPGRADE,
      0x3333,
      contract,
    );

    const res = simnet.callReadOnlyFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-contract-upgrade-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_UPG_CHECK_CHAIN));
  });

  it("should fail if `contract` address does not match this network", () => {
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      WC.ACTION_CONTRACT_UPGRADE,
      WC.EXPECTED_CHAIN_ID,
      "SP3NG7N03QKACBR7AWTPK79ZV86RAKXKDEH4BVF2B.wormhole-core-v5",
    );

    const res = simnet.callReadOnlyFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-contract-upgrade-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_UPG_CHECK_CONTRACT_ADDRESS));
  });

  it("should fail if `contract` address is a standard principal", () => {
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      WC.ACTION_CONTRACT_UPGRADE,
      WC.EXPECTED_CHAIN_ID,
      "ST1EYXDYXB4DD7WJC1QS7GZC35NT5CG35QSCZ08Q2",
    );

    const res = simnet.callReadOnlyFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-contract-upgrade-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_UPG_CHECK_CONTRACT_ADDRESS));
  });

  it.skip("should fail if payload is larger than expected", () => {
    let payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      WC.ACTION_CONTRACT_UPGRADE,
      WC.EXPECTED_CHAIN_ID,
      contract,
    );
    const validPayloadLen = payload.length;
    payload = Buffer.concat([Uint8Array.from(payload), new Uint8Array(1)]);
    const actualPayloadLen = payload.length;

    expect(actualPayloadLen).toBeGreaterThan(validPayloadLen);

    const res = simnet.callReadOnlyFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-contract-upgrade-payload`,
      [Cl.buffer(Uint8Array.from(payload))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_UPG_CHECK_OVERLAY));
  });
});

describe.skip(`${WC.CONTRACT_NAME}::contract-upgrade`, () => {
  const accounts = simnet.getAccounts();
  const deployer = accounts.get("deployer")!;
  const sender = accounts.get("wallet_1")!;
  const contract =
    "ST18JNZYRFDM14H9C8XETYJ29HMRGJDHZCQSB4X74.wormhole-core-v9000";
  const keychain = wormhole.generateGuardianSetKeychain(19);

  beforeEach(async () => {
    let res = wormhole.initializeStateContract(WC.CONTRACT_NAME, deployer);
    expect(res.result).toBeOk(Cl.bool(true));
  });

  it("should fail if `emitter.chain` is invalid", () => {
    let emitter = {
      chain: 17,
      address: wormhole.GovernanceUpdateEmitter.address,
    };
    const payload = wormhole.serializeContractUpgradeVaaPayloadToBuffer(
      WC.ACTION_TRANSFER_FEES,
      WC.EXPECTED_CHAIN_ID,
      contract,
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
      `contract-upgrade`,
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
      contract,
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
  });
});
