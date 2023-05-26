# stacks-wormhole

With this **stacks-wormhole** project, our goal is to connect the Stacks blockchain and the Bitcoin blockchain (to some extent) to the Wormhole protocol.

Stacks is a layer-1 blockchain that connects to Bitcoin for security and enables decentralized apps and predictable smart contracts using the [Clarity language](https://clarity-lang.org/). Stacks implements [Proof of Transfer (PoX)](https://community.stacks.org/pox) mining that anchors to Bitcoin security. Leader election happens at the Bitcoin blockchain and Stacks (STX) miners write new blocks on the separate Stacks blockchain. With PoX there is no need to modify Bitcoin to enable smart contracts and decentralized apps.

Wormhole is a decentralized generic interoperability protocol for multiple blockchain ecosystems with initial support for Solana, Terra, Ethereum and Binance Smart Chain.
It is also an ecosystem and platform for developers to grow the decentralized computing space. Wormhole consists of multiple modular swap-in components that can be leveraged independently and supports an increasing number of composable applications built by numerous teams.

## Usage

Clone repository

```bash
git clone git@github.com:hirosystems/stacks-wormhole.git
```

Install [Clarinet](https://github.com/hirosystems/clarinet#installation)

```bash
brew install clarinet
```

Execute the test suite

```bash
clarinet test
```

### Next steps

- [] Implement additional verifications in the `wormhole-core-v1::parse-and-verify-vaa` function
- [] Implement offchain component submitting VAA to the Stacks blockchain
- [] Implement a first `token-bridge` xDapp to close the loop 
