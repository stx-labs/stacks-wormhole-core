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

The contracts are developed in Clarity and use [clarinet-sdk](https://www.npmjs.com/package/@hirosystems/clarinet-sdk) for its test harnessing.

Git clone and compile **stacks-pyth-relayer**

```bash
$ git clone https://github.com/hirosystems/stacks-wormhole-core.git
$ cd stacks-wormhole-core
$ npm install
$ npm test
```

## Status

This repository is a copy of https://github.com/hirosystems/stacks-pyth-bridge/tree/main/contracts/wormhole.

In the context of the implementation of Pyth, the following features have been implemented:

- Ability to verify a VAA by checking the 19 cryptographic signatures from authorized guardians to ensure authenticity. This process ensures that the data within the VAA has not been tampered with and adheres to the consensus rules of the Wormhole protocol. Once verified, the VAA can be used to execute secure and reliable cross-chain actions.
- Ability to rotate the set of guardians. This process involves updating the list of guardians (validators) who are responsible for observing events and signing VAAs, ensuring that no single entity or small group can control the network over time.

Ultimately once the repo has been upgraded to a fully fledged version of Wormhole and the contracts are deployed the onchain deployment of Pyth should be updated and pointing to this new deployment (operation performed by Pyth governance).

## Goals

This project aims to implement only the `wormhole-core` contract.
The scope of this contract is outlined [here](https://wormhole.com/docs/learn/infrastructure/core-contracts/), and includes:

- Parsing VAAs
- Verifying VAAs against current Guardian set
- Updating Guardian set
- Formatting and emmitting event messages for the Watcher to use to create VAAs
- Collecting fees for emitting messages
- Upgrading core contract from VAA

## Deployment

This process will be different for the initial deployment, and slightly different for each update, depending on what has changed

### Initial Deployment

If there is no existing Wormhole state (in either the core or state contract) that needs to be preserved, follow this procedure:

1. Deploy **all** contracts in `./contracts`
2. Call `wormhole-core-v4::initialize` with argument `(none)`
3. Relayer must pass GuardianSetUpgrade VAA to `guardian-set-upgrade` to set the initial Guardian Set

### Future Updates

If the core contract set has already been deployed and there is state to preserve, follow this procedure:

#### Preparation

1. In general, you should only be updating `wormhole-core`
    1. Do not re-deploy trait or other contracts unless they have changed (and update version number if they have)
    2. **Never** re-deploy `wormhole-core-state`. This contract is not upgradeable. If you need additional state:
        1. Use the key/value storage provided in `wormhole-core-state`
        2. Deploy a new permanent state contract, eg. `wormhole-core-state-2`
2. **If deploying from a different address than the initial deployment, hard-code the full principals of contracts from previous deployments into `contract-call?` functions**

#### Deployment

1. Deploy new core contract and any additional contracts needed
2. Governance contract will issue a ContractUpgrade VAA containing principal of newly deployed core contract
3. Replayer must pass ContractUpgrade VAA to `contract-upgrade` in existing core contract
4. Call `wormhole-core-v4::initialize` in new contract with argument `(some <previous-contract>)`



