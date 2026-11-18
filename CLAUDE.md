# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stacks Wormhole Core implements the Wormhole cross-chain messaging protocol for the Stacks blockchain. It handles guardian set management, VAA (Verifiable Action Approval) parsing/verification, message emission, fee management, and governance — but does not bridge assets directly.

## Commands

- **Static analysis of Clarity contracts:** `clarinet check`
- **Run all tests:** `npm test`
- **Run a single test file:** `npx vitest run unit-tests/wormhole/vaa.test.ts`
- **Run tests matching a name:** `npx vitest run -t "pattern"`
- **Test with coverage:** `npm run test:coverage`
- **Format TypeScript tests:** `npm run format`

There is no separate build step. Clarity contracts are compiled and deployed into a simnet by the Clarinet SDK test environment automatically.

## Architecture

### Contract Layer (Clarity 5, Epoch 3.4)

**Permanent state contract (never upgraded):**
- `wormhole-core-state.clar` — Stores guardian sets, emitter sequences, consumed governance VAAs, and a key/value store. Only the active core contract (tracked via ownership) can write. Uses 2-step ownership transfer for upgrades.

**Upgradeable core contract:**
- `wormhole-core-v4.clar` — Main logic: VAA parsing/verification, guardian set upgrades, message posting, fee management, contract upgrades via governance VAAs. Has a deployment state machine: UNINITIALIZED → ACTIVE → DEPRECATED.

**Proxy:**
- `wormhole-core-proxy-v2.clar` — Workaround for Clarity's lack of dynamic dispatch. Third-party contracts pass a trait reference; the proxy validates it against the state contract's active contract before forwarding calls.

**Utility:**
- `addr32.clar` — Maps Stacks principals to 32-byte Wormhole addresses via keccak256 hashing (Stacks principals can exceed 32 bytes).

**Traits:**
- `wormhole-trait-core-v2` — Core operations (parse VAA, post message, etc.)
- `wormhole-trait-governance-v1` — Governance operations (upgrade, guardian set, fees)
- `wormhole-trait-export-v1` — State export for contract upgrades
- `protocol-send-trait-v1` — Protocol-agnostic send (NTT support for Wormhole and Axelar)

### Key Design Patterns

- **Upgradeable core + permanent state:** New core contract versions are deployed, state is exported/imported, and ownership is transferred in the state contract. The state contract itself is never replaced.
- **Governance via VAA:** All administrative operations (guardian set updates, fee changes, upgrades) require signed VAAs from the guardian network.
- **Wormhole chain ID for Stacks:** `0x003c` (60 decimal).

## Test Structure

Tests live in `unit-tests/wormhole/` and use Vitest with the Clarinet SDK simnet environment. Property-based testing uses `@fast-check/vitest`.

**Key test utilities:**
- `unit-tests/wormhole/helpers.ts` — `wormhole` namespace with guardian keychain generation, VAA building/serialization, signature generation (secp256k1), governance payload builders, and fast-check arbitrary generators (`wormhole.fc_ext`).
- `unit-tests/wormhole/constants.ts` — TypeScript classes mirroring contract error codes and constants (`WormholeCore`, `WormholeCoreState`, etc.). These must stay in sync with the Clarity contracts.
- `unit-tests/wormhole/fixtures.ts` — Real mainnet guardian set upgrade VAAs for integration-style tests.
- `unit-tests/utils/helpers.ts` — Buffer/bigint conversion utilities.

**Test patterns:**
- Tests use the `simnet` global from clarinet-sdk (`callPublicFn`, `callPrivateFn`, `callReadOnlyFn`, `mineBlock`).
- `beforeEach` calls `wormhole.initializeStateContract()` to set up fresh state.
- Accounts are accessed via `simnet.getAccounts().get("deployer")` etc.
- Matchers: `toBeOk()`, `toBeErr()` for Clarity response values.

## Conventions

- All files use LF line endings (enforced via `.gitattributes` and `.vscode/settings.json`).
- ES modules (`"type": "module"` in package.json).
- Commit messages use conventional prefixes: `feat:`, `fix:`, `chore:`, `perf:`, `tests:` with PR numbers appended as `(#N)`.
