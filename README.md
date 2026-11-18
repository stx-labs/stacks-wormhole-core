       /     /   ▶ Stacks Wormhole Bridge
      / --- /      Bridging Wormhole to the Stacks blockchain.
     /     /       

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[![Introduction](https://img.shields.io/badge/%23-%20Introduction%20-orange?labelColor=gray)](#Introduction)
&nbsp;&nbsp;&nbsp;&nbsp;[![Features](https://img.shields.io/badge/%23-Features-orange?labelColor=gray)](#Features)
&nbsp;&nbsp;&nbsp;&nbsp;[![Getting started](https://img.shields.io/badge/%23-Quick%20Start-orange?labelColor=gray)](#Quick-start)
&nbsp;&nbsp;&nbsp;&nbsp;[![Documentation](https://img.shields.io/badge/%23-Documentation-orange?labelColor=gray)](#Documentation)
&nbsp;&nbsp;&nbsp;&nbsp;[![Contribute](https://img.shields.io/badge/%23-Contribute-orange?labelColor=gray)](#Contribute)

---

# Introduction

**Status**: **Beta**

[Stacks](http://stacks.co) is a blockchain linked to Bitcoin by its consensus mechanism that spans the two chains, called Proof of Transfer. This enables Stacks to leverage Bitcoin’s security and enables Stacks apps to use Bitcoin’s state.
Stacks is a Bitcoin layer that enables decentralized apps and smart contracts.

[Wormhole](https://wormhole.com) is a decentralized attestation engine that leverages its network of guardians to trustlessly bridge information between the chains it supports. Wormhole has a simple, elegant, and pragmatic design that has enabled it to be the first real solution to ship to market and has received wide recognition and support from its member chains.

## Setup and and run the tests

The contracts are developed in Clarity and use [clarinet-sdk](https://www.npmjs.com/package/@stacks/clarinet-sdk) for its test harnessing.

Git clone and compile **stacks-wormhole-core**

```bash
$ git clone https://github.com/stx-labs/stacks-wormhole-core.git
$ cd stacks-wormhole-core
$ npm install
$ npm test
```

## Status

This repository was forked from the Wormhole contracts in https://github.com/stx-labs/stacks-pyth-bridge/tree/clarity-v3/

This project aims to implement a `wormhole-core` contract.
The core contract by itself cannot bridge assets to/from other chains.
Rather, it implements the Wormhole protocol, managing Wormhole governance and providing message handling functions for other contracts.
The scope of this contract is outlined [here](https://wormhole.com/docs/learn/infrastructure/core-contracts/), and includes:

- Setting list of up to 30 (currently 19) Wormhole Guardians that can sign VAAs (Verifiable Action Approval)
- Verifying VAA signatures against the guardian set’s ordered Ethereum addresses
- Formatting and emmitting event messages for Guardians to observe and send VAAs to other blockchains
- Collecting and transferring fees for emitting messages
- Updating the core contract via governance VAA

Again, this set of contracts is only a messaging/governance layer.
In order to send/receive messages or tokens to/from other chains, it is necessary to write contracts that manage the specific messages or tokens being transferred.

## Deployment

This process will be different for the initial deployment, and slightly different for each update, depending on what has changed

### Initial Deployment

If there is no existing Wormhole state (in either the core or state contract) that needs to be preserved, follow this procedure:

1. Deploy **all** contracts in `./contracts`
2. Call `wormhole-core-v4::initialize` with argument `(none)`
3. The deployer calls `guardian-set-upgrade` with the initial GuardianSetUpgrade VAA as its sole argument. The contract stores the 20-byte Ethereum addresses in payload order. For subsequent rotations, anyone can submit an update VAA signed by a quorum of the current set.

### Future Updates

If the core contract set has already been deployed and there is state to preserve, follow this procedure:

#### Preparation

1. In general, you should only be updating `wormhole-core`
    1. Do not re-deploy trait or other contracts unless they have changed (and update version number if they have)
    2. **Never** re-deploy `wormhole-core-state`. **This contract cannot be updated.** If you need additional state:
        1. Use the key/value storage provided in `wormhole-core-state`
        2. Deploy a new permanent state contract, eg. `wormhole-core-state-2`
2. **If deploying from a different address than the initial deployment, hard-code the full principals of contracts from previous deployments into `contract-call?` functions**

#### Deployment

1. Deploy new core contract and any additional contracts needed
2. Governance contract will issue a ContractUpgrade VAA containing principal of newly deployed core contract
3. Replayer must pass ContractUpgrade VAA to `contract-upgrade` in existing core contract
4. Call `wormhole-core-v4::initialize` in new contract with argument `(some <previous-contract>)`



