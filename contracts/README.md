# Contracts (MVP Single File)

Single Solidity file with:
- `USDStableToken` (demo USD, 6 decimals)
- `RealEstateDeed` (ERC721 with locker)
- `FractionToken` (ERC20 per property)
- `FractionOffering` (buy/claim/refund)
- `FractionFactory` (wires offering + lock)

## Build & Deploy (Sepolia)

```bash
cd contracts
forge install
forge build

export RPC_URL_SEPOLIA="https://eth-sepolia.g.alchemy.com/v2/<KEY>"
export PRIVATE_KEY="<DEPLOYER_PRIVATE_KEY>"
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL_SEPOLIA --private-key $PRIVATE_KEY --broadcast
```

## Create Offering (after deploy)
- Mint deed to issuer: `RealEstateDeed.mint(issuer, deedId, uri)`
- `FractionFactory.createOffering(deed, deedId, name, symbol, price, max, softCap, deadline)`
- Investors `approve(USD, Offering)` then `buy(fractions)`
- After deadline: `settle` and investors `claim()` or call `refund()`
