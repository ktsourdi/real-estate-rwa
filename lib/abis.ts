export const realEstateDeedAbi = [
  {
    "type": "function",
    "name": "ownerOf",
    "stateMutability": "view",
    "inputs": [ { "name": "tokenId", "type": "uint256" } ],
    "outputs": [ { "name": "owner", "type": "address" } ]
  },
  {
    "type": "function",
    "name": "mint",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "tokenId", "type": "uint256" },
      { "name": "tokenURI", "type": "string" }
    ],
    "outputs": []
  }
] as const

export const fractionFactoryAbi = [
  {
    "type": "function",
    "name": "createOffering",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "deedContract", "type": "address" },
      { "name": "deedId", "type": "uint256" },
      { "name": "fractionName", "type": "string" },
      { "name": "fractionSymbol", "type": "string" },
      { "name": "pricePerFraction", "type": "uint256" },
      { "name": "maxFractions", "type": "uint256" },
      { "name": "softCapFractions", "type": "uint256" }
    ],
    "outputs": [
      { "name": "fractions", "type": "address" },
      { "name": "offering", "type": "address" }
    ]
  }
] as const

// ERC20-only flow ABIs
export const propertyFactoryAbi = [
  {
    "type": "event",
    "name": "SaleCreated",
    "inputs": [
      { "name": "issuer", "type": "address", "indexed": true },
      { "name": "token", "type": "address", "indexed": false },
      { "name": "sale", "type": "address", "indexed": false },
      { "name": "name", "type": "string", "indexed": false },
      { "name": "symbol", "type": "string", "indexed": false },
      { "name": "pricePerToken", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "function",
    "name": "createSale",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "name_", "type": "string" },
      { "name": "symbol_", "type": "string" },
      { "name": "totalPriceUSD_6dp", "type": "uint256" }
    ],
    "outputs": [
      { "name": "token", "type": "address" },
      { "name": "sale", "type": "address" }
    ]
  }
] as const

export const propertySaleAbi = [
  { "type": "event", "name": "Purchased", "inputs": [ { "name": "buyer", "type": "address", "indexed": true }, { "name": "amount", "type": "uint256", "indexed": false }, { "name": "cost", "type": "uint256", "indexed": false } ] },
  { "type": "event", "name": "Refunded", "inputs": [ { "name": "buyer", "type": "address", "indexed": true }, { "name": "amount", "type": "uint256", "indexed": false }, { "name": "refund", "type": "uint256", "indexed": false } ] },
  { "type": "event", "name": "Settled", "inputs": [ { "name": "sold", "type": "uint256", "indexed": false }, { "name": "proceeds", "type": "uint256", "indexed": false } ] },
  { "type": "function", "name": "buy", "stateMutability": "nonpayable", "inputs": [{ "name": "amount", "type": "uint256" }], "outputs": [] },
  { "type": "function", "name": "claim", "stateMutability": "nonpayable", "inputs": [], "outputs": [] },
  { "type": "function", "name": "settle", "stateMutability": "nonpayable", "inputs": [], "outputs": [] },
  { "type": "function", "name": "pricePerToken", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "uint256" }] },
  { "type": "function", "name": "totalPurchased", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "uint256" }] },
  { "type": "function", "name": "purchased", "stateMutability": "view", "inputs": [{ "type": "address" }], "outputs": [{ "type": "uint256" }] },
  { "type": "function", "name": "MAX_SUPPLY", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "uint256" }] }
] as const

export const erc20Abi = [
  { "type": "function", "name": "name", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "string" }] },
  { "type": "function", "name": "symbol", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "string" }] },
  { "type": "function", "name": "decimals", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "uint8" }] },
  { "type": "function", "name": "balanceOf", "stateMutability": "view", "inputs": [{ "type": "address" }], "outputs": [{ "type": "uint256" }] },
  { "type": "function", "name": "approve", "stateMutability": "nonpayable", "inputs": [{ "type": "address" }, { "type": "uint256" }], "outputs": [{ "type": "bool" }] },
  { "type": "function", "name": "allowance", "stateMutability": "view", "inputs": [{ "type": "address" }, { "type": "address" }], "outputs": [{ "type": "uint256" }] }
] as const

// USDStableToken (demo) extends ERC20 with mint/burn and Ownable
export const usdAbi = [
  { "type": "function", "name": "name", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "string" }] },
  { "type": "function", "name": "symbol", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "string" }] },
  { "type": "function", "name": "decimals", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "uint8" }] },
  { "type": "function", "name": "balanceOf", "stateMutability": "view", "inputs": [{ "type": "address" }], "outputs": [{ "type": "uint256" }] },
  { "type": "function", "name": "approve", "stateMutability": "nonpayable", "inputs": [{ "type": "address" }, { "type": "uint256" }], "outputs": [{ "type": "bool" }] },
  { "type": "function", "name": "allowance", "stateMutability": "view", "inputs": [{ "type": "address" }, { "type": "address" }], "outputs": [{ "type": "uint256" }] },
  { "type": "function", "name": "owner", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "address" }] },
  { "type": "function", "name": "mint", "stateMutability": "nonpayable", "inputs": [{ "type": "address" }, { "type": "uint256" }], "outputs": [] },
  { "type": "function", "name": "burn", "stateMutability": "nonpayable", "inputs": [{ "type": "address" }, { "type": "uint256" }], "outputs": [] }
] as const

export const marketplaceAbi = [
  { "type": "event", "name": "Listed", "inputs": [ { "name": "id", "type": "uint256", "indexed": true }, { "name": "seller", "type": "address", "indexed": true }, { "name": "token", "type": "address", "indexed": true }, { "name": "amount", "type": "uint256", "indexed": false }, { "name": "pricePerTokenUSD6", "type": "uint256", "indexed": false } ] },
  { "type": "event", "name": "Purchased", "inputs": [ { "name": "id", "type": "uint256", "indexed": true }, { "name": "buyer", "type": "address", "indexed": true }, { "name": "amount", "type": "uint256", "indexed": false }, { "name": "costUSD6", "type": "uint256", "indexed": false } ] },
  { "type": "event", "name": "Cancelled", "inputs": [ { "name": "id", "type": "uint256", "indexed": true }, { "name": "seller", "type": "address", "indexed": true }, { "name": "remaining", "type": "uint256", "indexed": false } ] },
  { "type": "function", "name": "createListing", "stateMutability": "nonpayable", "inputs": [ { "name": "token", "type": "address" }, { "name": "amount", "type": "uint256" }, { "name": "pricePerTokenUSD6", "type": "uint256" }], "outputs": [ { "type": "uint256" } ] },
  { "type": "function", "name": "buy", "stateMutability": "nonpayable", "inputs": [ { "name": "id", "type": "uint256" }, { "name": "amount", "type": "uint256" } ], "outputs": [] },
  { "type": "function", "name": "cancel", "stateMutability": "nonpayable", "inputs": [ { "name": "id", "type": "uint256" } ], "outputs": [] },
  { "type": "function", "name": "listings", "stateMutability": "view", "inputs": [ { "name": "id", "type": "uint256" } ], "outputs": [ { "name": "seller", "type": "address" }, { "name": "token", "type": "address" }, { "name": "remaining", "type": "uint256" }, { "name": "pricePerTokenUSD6", "type": "uint256" } ] }
] as const


// Simple in-app Vault (demo): holds DUSD balances, 2% fee on withdraw
export const vaultAbi = [
  { "type": "event", "name": "Deposited", "inputs": [ { "name": "user", "type": "address", "indexed": true }, { "name": "amount", "type": "uint256", "indexed": false } ] },
  { "type": "event", "name": "Withdrawn", "inputs": [ { "name": "user", "type": "address", "indexed": true }, { "name": "gross", "type": "uint256", "indexed": false }, { "name": "fee", "type": "uint256", "indexed": false } ] },
  { "type": "function", "name": "token", "stateMutability": "view", "inputs": [], "outputs": [ { "type": "address" } ] },
  { "type": "function", "name": "feeBps", "stateMutability": "view", "inputs": [], "outputs": [ { "type": "uint16" } ] },
  { "type": "function", "name": "balanceOf", "stateMutability": "view", "inputs": [ { "name": "user", "type": "address" } ], "outputs": [ { "type": "uint256" } ] },
  { "type": "function", "name": "deposit", "stateMutability": "nonpayable", "inputs": [ { "name": "amount", "type": "uint256" } ], "outputs": [] },
  { "type": "function", "name": "withdraw", "stateMutability": "nonpayable", "inputs": [ { "name": "amount", "type": "uint256" } ], "outputs": [] }
] as const


