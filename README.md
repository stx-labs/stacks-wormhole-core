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
$ git clone https://github.com/hirosystems/stacks-wormhole-bridge.git
$ cd stacks-wormhole-bridge
$ npm install
$ npm test
```

## Status

This repository is a copy of https://github.com/hirosystems/stacks-pyth-bridge/tree/main/contracts/wormhole.

In the context of the implementation of Pyth, the following features have been implemented:

- Ability to verify a VAA by checking the 19 cryptographic signatures from authorized guardians to ensure authenticity. This process ensures that the data within the VAA has not been tampered with and adheres to the consensus rules of the Wormhole protocol. Once verified, the VAA can be used to execute secure and reliable cross-chain actions.

- Ability to rotate the set of guardians. This process involves updating the list of guardians (validators) who are responsible for observing events and signing VAAs, ensuring that no single entity or small group can control the network over time.

Ultimately once the repo has been upgraded to a fully fledged version of Wormhole and the contracts are deployed the onchain deployment of Pyth should be updated and pointing to this new deployment (operation performed by Pyth governance).