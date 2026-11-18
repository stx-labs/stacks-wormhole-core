import { Cl, ClarityType } from "@stacks/transactions";
import { expect, describe, beforeEach } from "vitest";
import { it, fc } from "@fast-check/vitest";
import { mineBlock, wormhole } from "./helpers";
import { ParsedTransactionResult, tx } from "@stacks/clarinet-sdk";
import { hexToBytes } from "@noble/hashes/utils";
import { keccak_256 } from "@noble/hashes/sha3";
import { WormholeCore as WC, WormholeCoreState as WCS } from "./constants";
import { gsuMainnetVaas } from "./fixtures";

const verbosity = 0;
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const sender = accounts.get("wallet_1")!;

const expectGuardianSetAddrs = (
  setId: number,
  expectedEthAddresses: Uint8Array[],
) => {
  const res = simnet.callReadOnlyFn(
    WCS.CONTRACT_NAME,
    "guardian-set-addrs-get",
    [Cl.uint(setId)],
    sender,
  ).result;
  expect(res).toStrictEqual(
    Cl.some(Cl.list(expectedEthAddresses.map((a) => Cl.buffer(a)))),
  );
};

beforeEach(async () => {
  let res = wormhole.initializeStateContract(WC.CONTRACT_NAME, deployer);
  expect(res.result).toBeOk(Cl.bool(true));
});

describe(`${WC.CONTRACT_NAME}::parse-vaa success`, () => {
  const keychain = wormhole.generateGuardianSetKeychain(19);

  it("should succeed if the vaa is valid", () => {
    let emitter = wormhole.GovernanceUpdateEmitter;
    let body = wormhole.buildValidVaaBodySpecs({ emitter });
    let headerSpecs = wormhole.buildValidVaaHeaderSpecs(keychain, body);

    fc.assert(
      fc.property(
        wormhole.fc_ext.vaaHeader(headerSpecs, 19),
        ([
          version,
          guardianSetIndex,
          providedSignatures,
          generatedSignatures,
        ]) => {
          let consolidatedSignatures = [
            ...(providedSignatures as Uint8Array[]),
            ...(generatedSignatures as Uint8Array[]),
          ];
          let header = wormhole.assembleVaaHeader(
            version,
            guardianSetIndex,
            consolidatedSignatures,
          );
          let vaa = wormhole.serializeVaaToBuffer(header, body);
          let [decodedVaa, guardiansPublicKeys] =
            wormhole.serializeVaaToClarityValue(header, body, keychain);

          const res = simnet.callPrivateFn(
            WC.CONTRACT_NAME,
            `parse-vaa`,
            [Cl.buffer(Uint8Array.from(vaa))],
            sender,
          );
          expect(res.result).toBeOk(
            Cl.tuple({
              vaa: decodedVaa,
              "recovered-public-keys": Cl.list(guardiansPublicKeys),
              "vaa-body-hash": Cl.buffer(wormhole.hashVaaBody(body)),
            }),
          );
        },
      ),
      { verbose: verbosity },
    );
  });
});

describe(`${WC.CONTRACT_NAME}::guardian-set-upgrade failures`, () => {
  const keychain = wormhole.generateGuardianSetKeychain(19);

  it("should fail if the chain is invalid", () => {
    // Before performing this test, we need to setup the guardian set
    let guardianRotationPayload =
      wormhole.serializeGuardianUpdateVaaPayloadToBuffer(
        keychain,
        2,
        1,
        1,
        wormhole.validGuardianRotationModule,
      );
    let body = wormhole.buildValidVaaBodySpecs({
      payload: Uint8Array.from(guardianRotationPayload),
      emitter: wormhole.GovernanceUpdateEmitter,
    });
    let header = wormhole.buildValidVaaHeader(keychain, body, {
      version: 1,
      guardianSetId: 0,
      signatures: [],
    });
    let vaa = wormhole.serializeVaaToBuffer(header, body);
    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `guardian-set-upgrade`,
      [Cl.buffer(Uint8Array.from(vaa))],
      deployer,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_GOV_CHECK_CHAIN));
  });

  it("should fail if the action is invalid", () => {
    // Before performing this test, we need to setup the guardian set
    let guardianRotationPayload =
      wormhole.serializeGuardianUpdateVaaPayloadToBuffer(
        keychain,
        0,
        0,
        1,
        wormhole.validGuardianRotationModule,
      );
    let body = wormhole.buildValidVaaBodySpecs({
      payload: Uint8Array.from(guardianRotationPayload),
      emitter: wormhole.GovernanceUpdateEmitter,
    });
    let header = wormhole.buildValidVaaHeader(keychain, body, {
      version: 1,
      guardianSetId: 0,
      signatures: [],
    });
    let vaa = wormhole.serializeVaaToBuffer(header, body);
    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `guardian-set-upgrade`,
      [Cl.buffer(Uint8Array.from(vaa))],
      deployer,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_GOV_CHECK_ACTION));
  });

  it("should fail if the module is invalid", () => {
    // Before performing this test, we need to setup the guardian set
    let guardianRotationPayload =
      wormhole.serializeGuardianUpdateVaaPayloadToBuffer(
        keychain,
        2,
        0,
        1,
        Buffer.from(
          "0000000000000000000000000000000000000000000000000000000000000000",
          "hex",
        ),
      );
    let body = wormhole.buildValidVaaBodySpecs({
      payload: Uint8Array.from(guardianRotationPayload),
      emitter: wormhole.GovernanceUpdateEmitter,
    });
    let header = wormhole.buildValidVaaHeader(keychain, body, {
      version: 1,
      guardianSetId: 0,
      signatures: [],
    });
    let vaa = wormhole.serializeVaaToBuffer(header, body);
    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `guardian-set-upgrade`,
      [Cl.buffer(Uint8Array.from(vaa))],
      deployer,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_GOV_CHECK_MODULE));
  });

  it("should fail if the emitter-address is invalid", () => {
    // Before performing this test, we need to setup the guardian set
    let emitter = {
      chain: wormhole.GovernanceUpdateEmitter.chain,
      address: hexToBytes(
        "0000000000000000000000000000000000000000000000000000000000000009",
      ),
    };
    let guardianRotationPayload =
      wormhole.serializeGuardianUpdateVaaPayloadToBuffer(
        keychain,
        2,
        0,
        1,
        wormhole.validGuardianRotationModule,
      );
    let body = wormhole.buildValidVaaBodySpecs({
      payload: Uint8Array.from(guardianRotationPayload),
      emitter,
    });
    let header = wormhole.buildValidVaaHeader(keychain, body, {
      version: 1,
      guardianSetId: 0,
      signatures: [],
    });
    let vaa = wormhole.serializeVaaToBuffer(header, body);
    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `guardian-set-upgrade`,
      [Cl.buffer(Uint8Array.from(vaa))],
      deployer,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_GOV_CHECK_EMITTER));
  });

  it("should fail if the emitter-chain is invalid", () => {
    // Before performing this test, we need to setup the guardian set
    let emitter = {
      chain: 9,
      address: wormhole.GovernanceUpdateEmitter.address,
    };
    let guardianRotationPayload =
      wormhole.serializeGuardianUpdateVaaPayloadToBuffer(
        keychain,
        2,
        0,
        1,
        wormhole.validGuardianRotationModule,
      );
    let body = wormhole.buildValidVaaBodySpecs({
      payload: Uint8Array.from(guardianRotationPayload),
      emitter,
    });
    let header = wormhole.buildValidVaaHeader(keychain, body, {
      version: 1,
      guardianSetId: 0,
      signatures: [],
    });
    let vaa = wormhole.serializeVaaToBuffer(header, body);
    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      `guardian-set-upgrade`,
      [Cl.buffer(Uint8Array.from(vaa))],
      deployer,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_GOV_CHECK_EMITTER));
  });
});

describe(`${WC.CONTRACT_NAME}::guardian-set-upgrade success`, () => {
  const guardianSet1Keys = wormhole.generateGuardianSetKeychain(19);
  const guardianSet2Keys = wormhole.generateGuardianSetKeychain(19);
  let guardianSet1 = Cl.tuple({});

  // Before starting the test suite, we have to setup the guardian set.
  beforeEach(async () => {
    let [result, vaaHeader, vaaBody] = wormhole.applyGuardianSetUpdate(
      guardianSet1Keys,
      1,
      deployer,
      WC.CONTRACT_NAME,
    );
    let [serializeVaaToClarityValue, _] = wormhole.serializeVaaToClarityValue(
      vaaHeader as wormhole.VaaHeader,
      vaaBody as wormhole.VaaBody,
      guardianSet1Keys,
    );

    guardianSet1 = Cl.tuple({
      "set-id": Cl.uint(1),
      guardians: Cl.list(
        guardianSet1Keys.map((g) => Cl.buffer(g.ethereumAddress)),
      ),
    });

    expect(result).toBeOk(
      Cl.tuple({
        result: Cl.tuple({
          "guardians-eth-addresses": Cl.list(
            guardianSet1Keys.map((g) => Cl.buffer(g.ethereumAddress)),
          ),
        }),
        vaa: serializeVaaToClarityValue,
      }),
    );

    expectGuardianSetAddrs(
      1,
      guardianSet1Keys.map((g) => g.ethereumAddress),
    );
  });

  it("should return the set 1 as active", () => {
    let res = simnet.callReadOnlyFn(
      WC.CONTRACT_NAME,
      `get-active-guardian-set`,
      [],
      sender,
    ).result;
    expect(res).toBeOk(guardianSet1);
  });

  it("should successfully handle subsequent rotation", () => {
    const guardianSet2 = Cl.tuple({
      "set-id": Cl.uint(2),
      guardians: Cl.list(
        guardianSet2Keys.map((g) => Cl.buffer(g.ethereumAddress)),
      ),
    });
    // Before performing this test, we need to setup the guardian set
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
    const [serializeVaaToClarityValue, _] = wormhole.serializeVaaToClarityValue(
      header,
      body,
      guardianSet1Keys,
    );
    let res = mineBlock([
      tx.callPublicFn(
        WC.CONTRACT_NAME,
        `guardian-set-upgrade`,
        [Cl.buffer(Uint8Array.from(vaa))],
        sender,
      ),
    ])[0].result;
    expect(res).toBeOk(
      Cl.tuple({
        result: Cl.tuple({
          "guardians-eth-addresses": Cl.list(
            guardianSet2Keys.map((g) => Cl.buffer(g.ethereumAddress)),
          ),
        }),
        vaa: serializeVaaToClarityValue,
      }),
    );

    res = simnet.callReadOnlyFn(
      WC.CONTRACT_NAME,
      `get-active-guardian-set`,
      [],
      sender,
    ).result;
    expect(res).toBeOk(guardianSet2);

    // Both sets remain available by ID after rotation.
    expectGuardianSetAddrs(
      1,
      guardianSet1Keys.map((g) => g.ethereumAddress),
    );
    expectGuardianSetAddrs(
      2,
      guardianSet2Keys.map((g) => g.ethereumAddress),
    );
  });

  it("should reject a rotation signed by the proposed guardians instead of the active guardians", () => {
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
    const header = wormhole.buildValidVaaHeader(guardianSet2Keys, body, {
      version: 1,
      guardianSetId: 1,
    });
    const vaa = wormhole.serializeVaaToBuffer(header, body);
    let res = mineBlock([
      tx.callPublicFn(
        WC.CONTRACT_NAME,
        `guardian-set-upgrade`,
        [Cl.buffer(Uint8Array.from(vaa))],
        sender,
      ),
    ])[0].result;
    expect(res).toBeErr(Cl.uint(WC.ERR_VAA_CHECKS_THRESHOLD_SIGNATURE));
  });
});

describe(`${WC.CONTRACT_NAME}::parse-and-verify-vaa success`, () => {
  const guardianSet1Keys = wormhole.generateGuardianSetKeychain(19);

  // Before starting the test suite, we have to setup the guardian set.
  beforeEach(async () => {
    let [result, vaaHeader, vaaBody] = wormhole.applyGuardianSetUpdate(
      guardianSet1Keys,
      1,
      deployer,
      WC.CONTRACT_NAME,
    );
    let [serializeVaaToClarityValue, _] = wormhole.serializeVaaToClarityValue(
      vaaHeader as wormhole.VaaHeader,
      vaaBody as wormhole.VaaBody,
      guardianSet1Keys,
    );

    expect(result).toBeOk(
      Cl.tuple({
        result: Cl.tuple({
          "guardians-eth-addresses": Cl.list(
            guardianSet1Keys.map((g) => Cl.buffer(g.ethereumAddress)),
          ),
        }),
        vaa: serializeVaaToClarityValue,
      }),
    );
  });

  it("should succeed if the vaa is valid", () => {
    let body = wormhole.buildValidVaaBodySpecs({
      emitter: wormhole.GovernanceUpdateEmitter,
    });
    let headerSpecs = wormhole.buildValidVaaHeaderSpecs(guardianSet1Keys, body);

    fc.assert(
      fc.property(
        wormhole.fc_ext.vaaHeader(headerSpecs, 19),
        ([
          version,
          guardianSetIndex,
          providedSignatures,
          generatedSignatures,
        ]) => {
          let consolidatedSignatures = [
            ...(providedSignatures as Uint8Array[]),
            ...(generatedSignatures as Uint8Array[]),
          ];
          let header = wormhole.assembleVaaHeader(
            version,
            guardianSetIndex,
            consolidatedSignatures,
          );
          let vaa = wormhole.serializeVaaToBuffer(header, body);
          let [decodedVaa, guardiansPublicKeys] =
            wormhole.serializeVaaToClarityValue(header, body, guardianSet1Keys);

          const res = simnet.callPrivateFn(
            WC.CONTRACT_NAME,
            `parse-vaa`,
            [Cl.buffer(Uint8Array.from(vaa))],
            sender,
          );
          res.result;
          expect(res.result).toBeOk(
            Cl.tuple({
              vaa: decodedVaa,
              "recovered-public-keys": Cl.list(guardiansPublicKeys),
              "vaa-body-hash": Cl.buffer(wormhole.hashVaaBody(body)),
            }),
          );
        },
      ),
      { verbose: verbosity },
    );
  });

  it("should succeed if quorum is just met", () => {
    // Before performing this test, we need to setup the guardian set
    let cutoff = 13;
    let guardianSet1KeysSubset = guardianSet1Keys.slice(0, cutoff);
    let body = wormhole.buildValidVaaBodySpecs({
      emitter: wormhole.GovernanceUpdateEmitter,
    });
    let header = wormhole.buildValidVaaHeader(guardianSet1KeysSubset, body, {
      version: 1,
      guardianSetId: 1,
    });
    let vaa = wormhole.serializeVaaToBuffer(header, body);
    let [decodedVaa, _] = wormhole.serializeVaaToClarityValue(
      header,
      body,
      guardianSet1KeysSubset,
    );

    const res = simnet.callReadOnlyFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-vaa`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeOk(
      Cl.tuple({
        vaa: decodedVaa,
        "vaa-body-hash": Cl.buffer(wormhole.hashVaaBody(body)),
      }),
    );
  });
});

describe(`${WC.CONTRACT_NAME}::parse-and-verify-vaa failures`, () => {
  const guardianSet1Keys = wormhole.generateGuardianSetKeychain(19);

  // Before starting the test suite, we have to setup the guardian set.
  beforeEach(async () => {
    wormhole.applyGuardianSetUpdate(
      guardianSet1Keys,
      1,
      deployer,
      WC.CONTRACT_NAME,
    );
  });

  it("should fail if the version is invalid", () => {
    // Before performing this test, we need to setup the guardian set
    let body = wormhole.buildValidVaaBodySpecs({
      emitter: wormhole.GovernanceUpdateEmitter,
    });
    let header = wormhole.buildValidVaaHeader(guardianSet1Keys, body, {
      version: 2,
      guardianSetId: 1,
    });
    let vaa = wormhole.serializeVaaToBuffer(header, body);
    const res = simnet.callReadOnlyFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-vaa`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_VAA_CHECKS_VERSION_UNSUPPORTED));
  });

  it("should fail if the guardianSetId is invalid", () => {
    // Before performing this test, we need to setup the guardian set
    let body = wormhole.buildValidVaaBodySpecs({
      emitter: wormhole.GovernanceUpdateEmitter,
    });
    let header = wormhole.buildValidVaaHeader(guardianSet1Keys, body, {
      version: 1,
      guardianSetId: 2,
    });
    let vaa = wormhole.serializeVaaToBuffer(header, body);
    const res = simnet.callReadOnlyFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-vaa`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(
      Cl.uint(WC.ERR_VAA_CHECKS_GUARDIAN_SET_CONSISTENCY),
    );
  });

  it.each([
    [13, WC.ERR_VAA_CHECKS_THRESHOLD_SIGNATURE],
    [19, WC.ERR_VAA_CHECKS_GUARDIAN_SET_CONSISTENCY],
  ])("should reject a quorum signature attributed to guardian index %i", (index, error) => {
    const body = wormhole.buildValidVaaBodySpecs({ emitter: wormhole.GovernanceUpdateEmitter });
    const header = wormhole.buildValidVaaHeader(guardianSet1Keys.slice(0, 13), body, {
      version: 1,
      guardianSetId: 1,
    });
    // Guardian 12 signed. Index 13 belongs to another guardian and index 19 is outside the set.
    header.signatures[12][0] = index;
    const vaa = wormhole.serializeVaaToBuffer(header, body);
    const res = simnet.callReadOnlyFn(
      WC.CONTRACT_NAME,
      "parse-and-verify-vaa",
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(error));
  });

  it("should fail if one key is being used multiple times", () => {
    // Before performing this test, we need to setup the guardian set
    let body = wormhole.buildValidVaaBodySpecs({
      emitter: wormhole.GovernanceUpdateEmitter,
    });
    let header = wormhole.buildValidVaaHeader(guardianSet1Keys, body, {
      version: 1,
      guardianSetId: 1,
    });
    // Override signatures
    for (let i = 0; i < header.signatures.length; i++) {
      header.signatures[i] = header.signatures[0];
    }
    let vaa = wormhole.serializeVaaToBuffer(header, body);
    const res = simnet.callReadOnlyFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-vaa`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_VAA_CHECKS_THRESHOLD_SIGNATURE));
  });

  it("should fail if too few signatures are being sent", () => {
    // Before performing this test, we need to setup the guardian set
    let body = wormhole.buildValidVaaBodySpecs({
      emitter: wormhole.GovernanceUpdateEmitter,
    });
    let header = wormhole.buildValidVaaHeader(guardianSet1Keys, body, {
      version: 1,
      guardianSetId: 1,
    });
    // Override signatures
    header.signatures = header.signatures.slice(0, 12);
    let vaa = wormhole.serializeVaaToBuffer(header, body);
    const res = simnet.callReadOnlyFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-vaa`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_VAA_CHECKS_THRESHOLD_SIGNATURE));
  });

  it("should fail if quorum is not met", () => {
    // Before performing this test, we need to setup the guardian set
    let body = wormhole.buildValidVaaBodySpecs({
      emitter: wormhole.GovernanceUpdateEmitter,
    });
    let header = wormhole.buildValidVaaHeader(guardianSet1Keys, body, {
      version: 1,
      guardianSetId: 1,
    });
    // Override signatures
    let cutoff = 12;
    for (let i = cutoff; i < header.signatures.length; i++) {
      header.signatures[i] = header.signatures[0];
    }
    let vaa = wormhole.serializeVaaToBuffer(header, body);
    const res = simnet.callReadOnlyFn(
      WC.CONTRACT_NAME,
      `parse-and-verify-vaa`,
      [Cl.buffer(Uint8Array.from(vaa))],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_VAA_CHECKS_THRESHOLD_SIGNATURE));
  });
});

describe(`${WC.CONTRACT_NAME}::guardian-set-upgrade mainnet guardian rotations`, () => {
  let block: ParsedTransactionResult[] | undefined = undefined;

  // Before starting the test suite, we have to setup the guardian set.
  beforeEach(async () => {
    block = wormhole.applyMainnetGuardianSetUpdates(deployer, WC.CONTRACT_NAME);
  });

  it("should succeed handling the 2 guardians rotations", () => {
    expect(block!).toHaveLength(1);
    block!.forEach((b: ParsedTransactionResult) => {
      expect(b.result).toHaveClarityType(ClarityType.ResponseOk);
    });

    // Derive expected eth addresses from the fixture pubkeys (last 20 bytes of keccak256).
    // Mainnet rotations 1 and 2 in the fixture set guardian-set IDs 3 and 4 respectively
    // (real Wormhole mainnet history).
    const ethAddrsFromFixture = (idx: number): Uint8Array[] =>
      gsuMainnetVaas[idx].keys.map((k) =>
        keccak_256(hexToBytes(k)).slice(12, 32),
      );
    expectGuardianSetAddrs(3, ethAddrsFromFixture(0));

    const newUpdateBlock = wormhole.applyNextMainnetGuardianSetUpdates(
      sender,
      WC.CONTRACT_NAME,
    );
    expect(newUpdateBlock!).toHaveLength(1);
    newUpdateBlock!.forEach((b: ParsedTransactionResult) => {
      expect(b.result).toHaveClarityType(ClarityType.ResponseOk);
    });
    expectGuardianSetAddrs(4, ethAddrsFromFixture(1));
  });
});

describe(`${WC.CONTRACT_NAME}::guardian-set-upgrade initial caller check`, () => {
  const keychain = wormhole.generateGuardianSetKeychain(19);

  it("should fail if non-deployer calls initial guardian set upgrade (ERR_GSU_CHECK_CALLER)", () => {
    const guardianRotationPayload =
      wormhole.serializeGuardianUpdateVaaPayloadToBuffer(
        keychain,
        2,
        0,
        1,
        wormhole.validGuardianRotationModule,
      );
    const body = wormhole.buildValidVaaBodySpecs({
      payload: Uint8Array.from(guardianRotationPayload),
      emitter: wormhole.GovernanceUpdateEmitter,
    });
    const header = wormhole.buildValidVaaHeader(keychain, body, {
      version: 1,
      guardianSetId: 0,
      signatures: [],
    });
    const vaa = wormhole.serializeVaaToBuffer(header, body);

    // `sender` (wallet_1) is NOT the deployer
    const res = simnet.callPublicFn(
      WC.CONTRACT_NAME,
      "guardian-set-upgrade",
      [Cl.buffer(Uint8Array.from(vaa))],
      sender, // Not deployer!
    );
    expect(res.result).toBeErr(Cl.uint(WC.ERR_GSU_CHECK_CALLER));
  });
});

describe(`${WC.CONTRACT_NAME}::guardian-set-upgrade index check`, () => {
  const guardianSet1Keys = wormhole.generateGuardianSetKeychain(19);
  const guardianSet2Keys = wormhole.generateGuardianSetKeychain(19);

  beforeEach(async () => {
    wormhole.applyGuardianSetUpdate(
      guardianSet1Keys,
      1,
      deployer,
      WC.CONTRACT_NAME,
    );
  });

  it("should fail if new guardian set index is not current + 1 (ERR_GSU_CHECK_INDEX)", () => {
    // Try to upgrade from set 1 to set 3 (skipping 2)
    const guardianRotationPayload =
      wormhole.serializeGuardianUpdateVaaPayloadToBuffer(
        guardianSet2Keys,
        2,
        0,
        3, // Should be 2, not 3
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

    const res = mineBlock([
      tx.callPublicFn(
        WC.CONTRACT_NAME,
        "guardian-set-upgrade",
        [Cl.buffer(Uint8Array.from(vaa))],
        sender,
      ),
    ])[0].result;
    expect(res).toBeErr(Cl.uint(WC.ERR_GSU_CHECK_INDEX));
  });
});

describe(`${WC.CONTRACT_NAME}::guardian-set-upgrade empty set`, () => {
  const keychain = wormhole.generateGuardianSetKeychain(19);

  beforeEach(async () => {
    wormhole.applyGuardianSetUpdate(keychain, 1, deployer, WC.CONTRACT_NAME);
  });

  it("should fail if new guardian set is empty (ERR_GSU_PARSING_GUARDIANS_BYTES)", () => {
    // With 0 guardians, the payload parsing fails at `read-buff-8192-max` because
    // `(slice? buf u5 u5)` on a 5-byte buffer returns `none` in Clarity.
    // This means `ERR_GSU_EMPTY_GUARDIAN_SET` is unreachable via normal parsing;
    // the parsing error catches empty sets first.
    const emptyKeychain: wormhole.Guardian[] = [];
    const guardianRotationPayload =
      wormhole.serializeGuardianUpdateVaaPayloadToBuffer(
        emptyKeychain,
        2,
        0,
        2,
        wormhole.validGuardianRotationModule,
      );
    const body = wormhole.buildValidVaaBodySpecs({
      payload: Uint8Array.from(guardianRotationPayload),
      emitter: wormhole.GovernanceUpdateEmitter,
    });
    const header = wormhole.buildValidVaaHeader(keychain, body, {
      version: 1,
      guardianSetId: 1,
    });
    const vaa = wormhole.serializeVaaToBuffer(header, body);

    const res = mineBlock([
      tx.callPublicFn(
        WC.CONTRACT_NAME,
        "guardian-set-upgrade",
        [Cl.buffer(Uint8Array.from(vaa))],
        sender,
      ),
    ])[0].result;
    expect(res).toBeErr(Cl.uint(WC.ERR_GSU_PARSING_GUARDIANS_BYTES));
  });
});

describe(`${WC.CONTRACT_NAME}::guardian-set-upgrade overlay`, () => {
  const keychain = wormhole.generateGuardianSetKeychain(19);
  const newKeychain = wormhole.generateGuardianSetKeychain(5);

  beforeEach(async () => {
    wormhole.applyGuardianSetUpdate(keychain, 1, deployer, WC.CONTRACT_NAME);
  });

  it("should fail if guardian set upgrade payload has extra bytes (ERR_GSU_CHECK_OVERLAY)", () => {
    // Build a valid payload then append extra bytes
    let guardianRotationPayload =
      wormhole.serializeGuardianUpdateVaaPayloadToBuffer(
        newKeychain,
        2,
        0,
        2,
        wormhole.validGuardianRotationModule,
      );
    // Append extra byte
    guardianRotationPayload = Buffer.concat([
      Uint8Array.from(guardianRotationPayload),
      new Uint8Array(1),
    ]);

    const body = wormhole.buildValidVaaBodySpecs({
      payload: Uint8Array.from(guardianRotationPayload),
      emitter: wormhole.GovernanceUpdateEmitter,
    });
    const header = wormhole.buildValidVaaHeader(keychain, body, {
      version: 1,
      guardianSetId: 1,
    });
    const vaa = wormhole.serializeVaaToBuffer(header, body);

    const res = mineBlock([
      tx.callPublicFn(
        WC.CONTRACT_NAME,
        "guardian-set-upgrade",
        [Cl.buffer(Uint8Array.from(vaa))],
        sender,
      ),
    ])[0].result;
    expect(res).toBeErr(Cl.uint(WC.ERR_GSU_CHECK_OVERLAY));
  });
});

describe(`${WC.CONTRACT_NAME}::guardian-set-upgrade with broadcast chain`, () => {
  const keychain = wormhole.generateGuardianSetKeychain(19);
  const newKeychain = wormhole.generateGuardianSetKeychain(19);

  beforeEach(async () => {
    wormhole.applyGuardianSetUpdate(keychain, 1, deployer, WC.CONTRACT_NAME);
  });

  it("should succeed with broadcast chain ID (0x0000) for guardian set upgrade", () => {
    // Use chain=0 (broadcast) instead of specific chain ID
    const guardianRotationPayload =
      wormhole.serializeGuardianUpdateVaaPayloadToBuffer(
        newKeychain,
        2,
        0, // broadcast chain ID
        2,
        wormhole.validGuardianRotationModule,
      );
    const body = wormhole.buildValidVaaBodySpecs({
      payload: Uint8Array.from(guardianRotationPayload),
      emitter: wormhole.GovernanceUpdateEmitter,
    });
    const header = wormhole.buildValidVaaHeader(keychain, body, {
      version: 1,
      guardianSetId: 1,
    });
    const vaa = wormhole.serializeVaaToBuffer(header, body);

    const res = mineBlock([
      tx.callPublicFn(
        WC.CONTRACT_NAME,
        "guardian-set-upgrade",
        [Cl.buffer(Uint8Array.from(vaa))],
        sender,
      ),
    ])[0].result;
    expect(res).toHaveClarityType(ClarityType.ResponseOk);
  });
});

describe(`${WC.CONTRACT_NAME}::guardian-set-upgrade with old guardian set`, () => {
  const guardianSet1Keys = wormhole.generateGuardianSetKeychain(19);
  const guardianSet2Keys = wormhole.generateGuardianSetKeychain(19);

  beforeEach(async () => {
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

  it("should fail guardian-set-upgrade if signed by old guardian set (ERR_GOV_VAA_OLD_GUARDIAN_SET)", () => {
    const guardianSet3Keys = wormhole.generateGuardianSetKeychain(19);
    const guardianRotationPayload =
      wormhole.serializeGuardianUpdateVaaPayloadToBuffer(
        guardianSet3Keys,
        2,
        0,
        3,
        wormhole.validGuardianRotationModule,
      );
    const body = wormhole.buildValidVaaBodySpecs({
      payload: Uint8Array.from(guardianRotationPayload),
      emitter: wormhole.GovernanceUpdateEmitter,
      sequence: 99n,
    });
    // Sign with old guardian set 1 keys
    const header = wormhole.buildValidVaaHeader(guardianSet1Keys, body, {
      version: 1,
      guardianSetId: 1,
    });
    const vaa = wormhole.serializeVaaToBuffer(header, body);

    const res = mineBlock([
      tx.callPublicFn(
        WC.CONTRACT_NAME,
        "guardian-set-upgrade",
        [Cl.buffer(Uint8Array.from(vaa))],
        sender,
      ),
    ])[0].result;
    expect(res).toBeErr(Cl.uint(WC.ERR_GOV_VAA_OLD_GUARDIAN_SET));
  });
});
