# Sui MetaMask Snap

![](./packages/wallet-dapp/public/favicon.svg)

This Snap allows MetaMask users to interact with the Sui blockchain.

## Usage

The Snap can be installed by visiting [https://suisnap.com](https://suisnap.com) or any app that has integrated the Snap (see below for integration instructions).

Since Snaps are not yet supported in the stable version of MetaMask (coming soon), you will need to install [MetaMask Flask](https://metamask.io/flask/) (a developer preview version of MetaMask) to use the Snap. For apps to be able to connect to Flask, you will need to disable MetaMask and any other wallets that might be overriding the `window.ethereum` object.

## Enable Sui Snap in your app

Since MetaMask Snaps don't support the wallet standard, the Sui Snap wallet needs to be registered manually.
You can do this by installing the `@kunalabs-io/sui-snap-wallet` package and calling the `registerSuiSnapWallet` function in the initialization of your app (e.g., in `main.tsx`):

```bash
pnpm install @kunalabs-io/sui-snap-wallet
```

```ts
import { registerSuiSnapWallet } from "@kunalabs-io/sui-snap-wallet";

registerSuiSnapWallet();
```

## Development

- `pnpm install`
- run `pnpm build` in `packages/wallet-adapter`
- run `pnpm dev` in both `packages/snap` and `packages/wallet-dapp`
