import { Cl } from "@stacks/transactions";
import { expect, describe, beforeEach } from "vitest";
import { it } from "@fast-check/vitest";
import { keccak_256 } from "@noble/hashes/sha3";
import { wormhole } from "./helpers";
import { WormholeCore as WC, WormholeCoreState as WCS } from "./constants";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const sender = accounts.get("wallet_1")!;

beforeEach(async () => {
  let res = wormhole.initializeStateContract(WC.CONTRACT_NAME, deployer);
  expect(res.result).toBeOk(Cl.bool(true));
});

describe(`principal-to-string success`, () => {
  // Test `principal-to-string` from `SP1E0XBN9T4B10E9QMR7XMFJPMA19D77WY3KP2QKC.self-listing-helper-v3`
  // NOTE: This is tested much more thoroughly in a separate repo: https://github.com/hirosystems/principal-to-string-tests
  it("Works for mainnet singlesig address", () => {
    const addr = "SPJAX2AWN7HGWHYNZQFNVJV69D156A7WYC3GZSM9";
    const res = simnet.callReadOnlyFn(
      "SP1E0XBN9T4B10E9QMR7XMFJPMA19D77WY3KP2QKC.self-listing-helper-v3",
      "principal-to-string",
      [Cl.principal(addr)],
      sender,
    );
    expect(res.result).toBeAscii(addr);
  });
});

describe(`${WC.CONTRACT_NAME}::get-wormhole-address success`, () => {
  it("should generate Wormhole Address on first call", () => {
    const stacksAddresses = [
      "STNM8Z3SHKWNVB4PQEQT0VAFF6QCPG6FQ621CMZ7",
      "ST2ET05JZ12AB0M7WBZJJXJM80J0EZQRJ3MMV7R4M",
      "STY3P9MHYCQNA6WZ5FQ6W0MH8P85Y4AW5TC76QWB",
    ];

    for (const addr of stacksAddresses) {
      const expectedWormholeAddr = Cl.buffer(keccak_256(addr));

      // First call should generate new address
      let res = simnet.callPublicFn(
        WC.CONTRACT_NAME,
        "get-wormhole-address",
        [Cl.principal(addr)],
        sender,
      );
      expect(res.result).toBeOk(
        Cl.tuple({
          created: Cl.bool(true),
          "wormhole-address": expectedWormholeAddr,
        }),
      );

      // Second call should fetch address from cache
      res = simnet.callPublicFn(
        WC.CONTRACT_NAME,
        "get-wormhole-address",
        [Cl.principal(addr)],
        sender,
      );
      expect(res.result).toBeOk(
        Cl.tuple({
          created: Cl.bool(false),
          "wormhole-address": expectedWormholeAddr,
        }),
      );
    }
  });
});

describe(`${WC.CONTRACT_NAME}::get-wormhole-address failure`, () => {
  it("should fail if address doesn't match network", () => {
    const stacksAddresses = [
      "SP18CWK5776WQ9403QFNMKJTT4SPRAW1AM6CZBVCA", // Mainnet singlesig
      "SM2KCAEJ8VR4KB8KY9F8G33B76H5R95RKC2B9E4Z2", // Mainnet multisig
    ];

    for (const addr of stacksAddresses) {
      let res = simnet.callPublicFn(
        WC.CONTRACT_NAME,
        "get-wormhole-address",
        [Cl.principal(addr)],
        sender,
      );
      expect(res.result).toBeErr(Cl.uint(WCS.ERR_STATE_INVALID_VALUE));
    }
  });
});
