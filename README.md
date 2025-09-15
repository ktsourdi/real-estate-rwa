# Tokenised Real Estate – Fractional Ownership & Marketplace

## check out deployed app in Vercel and Ethereum Testnet https://real-estate-rwa.vercel.app

A web app that tokenises real-world real estate into on-chain fractions so anyone can buy, hold, and trade a share. Includes a simple marketplace for primary sales and peer-to-peer listings.

> **One-liner (non-technical):** Buy and trade small pieces of property online—like shares—safely and transparently.

---

## Features

- **Fractional ownership:** Split a property into on-chain shares (ERC-20 fractions backed by an escrowed ERC-721 deed).
- **Marketplace:** List, buy, and sell fractions; primary issuance by the property issuer and secondary trading between users.
- **Wallet support:** Connect with wallets (MetaMask / WalletConnect) via `wagmi` + `viem`.
- **Network ready:** Works on Ethereum testnets (e.g. Sepolia). Mainnet-ready with proper configuration.
- **Vercel-friendly:** Next.js 14+ (App Router) with an easy deployment path.

---

## Tech Stack

- **Frontend:** Next.js 14+, TypeScript, Tailwind CSS, `wagmi` v2, `viem`
- **Smart contracts:** Solidity ^0.8.20 (example uses 0.8.28), OpenZeppelin, Foundry (build/test/deploy)
- **Infra:** Vercel (frontend), Alchemy/Infura (RPC)

---

## Repository Structure

```
.
├─ web/                      # Next.js app (frontend)
│  ├─ app/                   # App Router pages & routes
│  ├─ components/            # UI components
│  ├─ lib/                   # wagmi/viem config, helpers
│  ├─ public/                # static assets
│  ├─ abi/                   # ABIs & addresses (copied from /contracts/out)
│  ├─ env.example            # frontend env template
│  └─ package.json
├─ contracts/                # Solidity smart contracts (Foundry)
│  ├─ src/
│  │  ├─ RealEstateDeed.sol          # ERC-721 deed (escrowed)
│  │  ├─ FractionToken.sol           # ERC-20 fractions per property
│  │  ├─ FractionFactory.sol         # Creates fraction tokens for deeds
│  │  └─ Marketplace.sol             # List/buy/sell fractions
│  ├─ script/
│  │  ├─ Deploy.s.sol                # Deployment script
│  │  └─ PostDeploy.s.sol            # Wire-up, roles, initial listings
│  ├─ test/                          # Foundry tests
│  ├─ foundry.toml
│  └─ remappings.txt
├─ package.json
└─ README.md
```

> **Design:** Each property is an ERC-721 deed escrowed into the protocol. A dedicated ERC-20 **FractionToken** is minted to represent shares. **Marketplace** handles listings & trades of those fractions.

---

## Prerequisites

- Node.js 18+  
- Yarn (classic or Berry)  
- Foundry (`curl -L https://foundry.paradigm.xyz | bash` then `foundryup`)  
- RPC provider key (Alchemy/Infura/etc.)  
- Funded deployer wallet on your target network (e.g. Sepolia ETH)

---

## Quick Start

### 1) Contracts — install, build, test

```bash
cd contracts
forge install
forge build
forge test
```

### 2) Deploy contracts (example: Sepolia)

Create `contracts/.env`:

```env
RPC_URL_SEPOLIA="https://eth-sepolia.g.alchemy.com/v2/<YOUR_KEY>"
PRIVATE_KEY="<YOUR_DEPLOYER_PRIVATE_KEY>"
ETHERSCAN_API_KEY="<optional_for_verification>"
```

Deploy:

```bash
cd contracts
forge script script/Deploy.s.sol:Deploy   --rpc-url $RPC_URL_SEPOLIA   --private-key $PRIVATE_KEY   --broadcast --verify
```

Export ABIs & addresses to the frontend:

```bash
mkdir -p ../web/abi
cp -R out/*.json ../web/abi/

# Create/update addresses map for the frontend:
cat > ../web/abi/addresses.json <<'JSON'
{
  "sepolia": {
    "FractionFactory": "0x...",
    "Marketplace": "0x...",
    "ExampleDeed": "0x...",
    "ExampleFraction": "0x..."
  }
}
JSON
```

### 3) Frontend — configure & run

Create `web/env.example`:

```env
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/<YOUR_KEY>"
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="<YOUR_WC_PROJECT_ID>"
NEXT_PUBLIC_DEFAULT_MARKETPLACE="0x..."   # deployed Marketplace address
```

Then:

```bash
cd web
cp env.example .env.local
yarn
yarn dev
```

Open http://localhost:3000.

---

## Frontend Overview

- **Connect wallet:** `wagmi` + `viem` using `NEXT_PUBLIC_*` envs.  
- **Browse properties:** Read deed metadata & fraction supply.  
- **Buy fractions:** Calls `Marketplace.buy()` for listed items.  
- **List fractions:** Approve `Marketplace` and create a listing.

**Key files (web/):**
- `app/page.tsx` — Home & featured properties
- `app/marketplace/page.tsx` — Listings view
- `app/assets/[address]/page.tsx` — Asset detail (deed + fractions)
- `lib/wagmi.ts` — Chains, transports, connectors
- `lib/contracts.ts` — ABI loaders & typed helpers
- `abi/*.json` — ABIs copied from `/contracts/out`
- `abi/addresses.json` — Network addresses map

---

## Contracts Overview

- **`RealEstateDeed.sol` (ERC-721):**  
  Represents a unique property deed. When fractionalised, the deed is escrowed (non-transferable by the owner while fractions exist).

- **`FractionToken.sol` (ERC-20):**  
  Fungible fractions for a given deed. Minted only via `FractionFactory` during fractionalisation and optionally for follow-on raises (if allowed by governance).

- **`FractionFactory.sol`:**  
  Creates new `FractionToken` instances for a deed, sets initial supply, and locks the deed into escrow.

- **`Marketplace.sol`:**  
  Fixed-price listings, buys, and cancels. Sellers must `approve()` the marketplace to transfer fractions.

---

## Environment Variables

### `/web/.env.local`
```env
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/<YOUR_KEY>"
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="<YOUR_WC_PROJECT_ID>"
NEXT_PUBLIC_DEFAULT_MARKETPLACE="0xMarketplaceAddress"
```

### `/contracts/.env`
```env
RPC_URL_SEPOLIA="https://eth-sepolia.g.alchemy.com/v2/<YOUR_KEY>"
PRIVATE_KEY="<DEPLOYER_PRIVATE_KEY>"
ETHERSCAN_API_KEY="<optional>"
```

---

## Deployment

### Frontend (Vercel)
1. Push the repo to GitHub/GitLab.
2. Import the `web/` project in Vercel.
3. Set env vars from `web/env.example` in Vercel Project Settings.
4. Build & deploy (default Next.js build).

### Contracts
- Use Foundry scripts for each target network.  
- After each deploy, update `web/abi/addresses.json` and copy ABIs to `web/abi/`.

---

## Scripts

**Frontend**
```bash
# inside /web
yarn dev
yarn build
yarn start
```

**Contracts**
```bash
# inside /contracts
forge build
forge test
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify
```

---

## Testing

- **Contracts:** Foundry unit tests in `/contracts/test` (approvals, re-entrancy guards, fee maths, partial fills).
- **Frontend:** `vitest` + `@testing-library/react` for components and basic flows.

---

## Security & Compliance

- **Audits:** Not audited. Do **not** use in production without a professional security review.
- **KYC/Compliance:** Real estate is regulated (KYC/AML, securities law, custodianship, valuation). This repo is a tech demo; integrate proper compliance and legal review before real-world use.
- **Upgradability & Roles:** If adding admin roles or proxies, document them clearly and restrict with a multi-sig where appropriate.

> **Disclaimer:** This software is provided “as is”, for educational and demo purposes only. It is **not** financial advice.

---

## Roadmap (suggested)

- [ ] Protocol fees & royalties  
- [ ] Auction mechanisms for primary offerings  
- [ ] Off-chain appraisal feeds & attestations  
- [ ] Multi-asset portfolios (SPVs)  
- [ ] On-chain governance for property actions

---

## Contribution

PRs and issues are welcome. Please:
1. Run `forge fmt` / `forge test`.
2. Run `yarn build` in `web/`.
3. Describe your change clearly and link any related issues.

---

## Licence

MIT

---

### Appendix: Minimal `lib/wagmi.ts` (snippet)

```ts
// web/lib/wagmi.ts
import { http, createConfig } from 'wagmi'
import { walletConnect } from 'wagmi/connectors'
import { sepolia } from 'wagmi/chains'

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
  },
  connectors: [
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID! }),
  ],
})
```
