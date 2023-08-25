# Sui MetaMask Snap

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
