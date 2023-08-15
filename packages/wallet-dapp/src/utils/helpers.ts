import { devnetConnectionUrl, testnetConnectionUrl } from './const'

export const getTokenSymbolFromTypeArg = (typeArg: string, separator = '::') => {
  const lastIndexOfSeparator = typeArg.lastIndexOf(separator)
  if (lastIndexOfSeparator >= 0) {
    return typeArg.substring(lastIndexOfSeparator + separator.length)
  }

  return ''
}

export const ellipsizeTokenAddress = (tokenAddress: string) =>
  `${tokenAddress.substring(0, 5)}...${tokenAddress.substring(tokenAddress.length - 5, tokenAddress.length)}`

export const getPackageIdFromTypeArg = (typeArg: string, separator = '::') => {
  const firstIndexOfSeparator = typeArg.indexOf(separator)
  if (firstIndexOfSeparator >= 0) {
    return typeArg.substring(0, firstIndexOfSeparator)
  }
  return ''
}

export const getNetworkFromUrl = (networkUrl: string) => {
  switch (networkUrl) {
    case testnetConnectionUrl:
      return 'testnet'
    case devnetConnectionUrl:
      return 'devnet'
    default:
      return 'mainnet'
  }
}
