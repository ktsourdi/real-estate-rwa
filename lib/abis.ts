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
  { "type": "function", "name": "buy", "stateMutability": "nonpayable", "inputs": [{ "name": "amount", "type": "uint256" }], "outputs": [] },
  { "type": "function", "name": "claim", "stateMutability": "nonpayable", "inputs": [], "outputs": [] },
  { "type": "function", "name": "settle", "stateMutability": "nonpayable", "inputs": [], "outputs": [] },
  { "type": "function", "name": "pricePerToken", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "uint256" }] },
  { "type": "function", "name": "totalPurchased", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "uint256" }] },
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


