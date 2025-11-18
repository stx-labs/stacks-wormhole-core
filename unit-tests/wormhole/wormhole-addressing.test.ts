import { Cl } from "@stacks/transactions";
import { expect, describe } from "vitest";
import { it } from "@fast-check/vitest";
import { keccak_256 } from "@noble/hashes/sha3";
import { Addr32 } from "./constants";

const accounts = simnet.getAccounts();
const sender = accounts.get("wallet_1")!;

describe(`${Addr32.CONTRACT_NAME}::register success`, () => {
  it("should generate Wormhole Address on first call", () => {
    const stacksAddresses = [
      // Testnet singlesig
      "STNM8Z3SHKWNVB4PQEQT0VAFF6QCPG6FQ621CMZ7",
      "ST2ET05JZ12AB0M7WBZJJXJM80J0EZQRJ3MMV7R4M",
      "STY3P9MHYCQNA6WZ5FQ6W0MH8P85Y4AW5TC76QWB",
      // Testnet multisig
      "SN17BKV3759FG8H6CSZP2NNE2SPV34MZD0Z8T4E30",
      "SN1TP7CNY63KQY7DVRDVPNE1X73ND3PT8JWQ13DYM",
      "SN1Z6BP8PDKYKXTZXXSKXFEY6NQ7RAM7DAD77WP1N",
    ];

    for (const addr of stacksAddresses) {
      const expectedWormholeAddr = Cl.buffer(keccak_256(addr));

      // First call should generate new address
      let res = simnet.callPublicFn(
        Addr32.CONTRACT_NAME,
        "register",
        [Cl.principal(addr)],
        sender,
      );
      expect(res.result).toBeOk(
        Cl.tuple({
          created: Cl.bool(true),
          addr32: expectedWormholeAddr,
        }),
      );

      // Second call should fetch address from cache
      res = simnet.callPublicFn(
        Addr32.CONTRACT_NAME,
        "register",
        [Cl.principal(addr)],
        sender,
      );
      expect(res.result).toBeOk(
        Cl.tuple({
          created: Cl.bool(false),
          addr32: expectedWormholeAddr,
        }),
      );
    }
  });
});

describe(`${Addr32.CONTRACT_NAME}::get-wormhole-address failure`, () => {
  it("should fail if address doesn't match network", () => {
    const stacksAddresses = [
      "SP18CWK5776WQ9403QFNMKJTT4SPRAW1AM6CZBVCA", // Mainnet singlesig
      "SM2KCAEJ8VR4KB8KY9F8G33B76H5R95RKC2B9E4Z2", // Mainnet multisig
    ];

    for (const addr of stacksAddresses) {
      let res = simnet.callPublicFn(
        Addr32.CONTRACT_NAME,
        "register",
        [Cl.principal(addr)],
        sender,
      );
      expect(res.result).toBeErr(Cl.uint(Addr32.ERR_INVALID_ADDRESS));
    }
  });
});
