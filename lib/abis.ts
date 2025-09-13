export const realEstateDeedAbi = [
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
      { "name": "softCapFractions", "type": "uint256" },
      { "name": "deadline", "type": "uint256" }
    ],
    "outputs": [
      { "name": "fractions", "type": "address" },
      { "name": "offering", "type": "address" }
    ]
  }
] as const


