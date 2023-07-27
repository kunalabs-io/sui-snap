export const ellipsizeTokenAddress = (tokenAddress: string) =>
  `${tokenAddress.substr(0, 5)}...${tokenAddress.substr(tokenAddress.length - 5, tokenAddress.length)}`
