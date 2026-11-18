import { Cl } from "@stacks/transactions";
import { expect, describe, beforeEach } from "vitest";
import { it } from "@fast-check/vitest";
import { wormhole } from "./helpers";
import { WormholeCore as WC, WormholeCoreProxy as WCP } from "./constants";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const sender = accounts.get("wallet_1")!;

describe(`${WCP.CONTRACT_NAME}::proxy with wrong contract`, () => {
  const keychain = wormhole.generateGuardianSetKeychain(19);

  beforeEach(async () => {
    let res = wormhole.initializeStateContract(WC.CONTRACT_NAME, deployer);
    expect(res.result).toBeOk(Cl.bool(true));

    wormhole.applyGuardianSetUpdate(keychain, 1, deployer, WC.CONTRACT_NAME);
  });

  it("should fail if wrong contract is passed to proxy", async () => {
    // Deploy a fake contract that implements the trait
    const fakeContractName = "fake-wormhole-core";
    const fakeCode = await (async () => {
      const fs = require("fs/promises");
      return await fs.readFile(`contracts/${WC.CONTRACT_NAME}.clar`, "utf8");
    })();
    const deployRes = simnet.deployContract(
      fakeContractName,
      fakeCode,
      null,
      deployer,
    );
    expect(deployRes.result).toBeOk(Cl.bool(true));

    const fakeContractPrincipal = `${deployer}.${fakeContractName}`;
    const payload = Cl.buffer(new Uint8Array(32));
    const nonce = Cl.uint(0);

    const res = simnet.callPublicFn(
      WCP.CONTRACT_NAME,
      "post-message",
      [Cl.principal(fakeContractPrincipal), payload, nonce, Cl.none()],
      sender,
    );
    expect(res.result).toBeErr(Cl.uint(WCP.ERR_TRAIT_CHECK_CONTRACT_MISMATCH));
  });
});
