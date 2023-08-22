import { devnetConnectionUrl, testnetConnectionUrl } from './const'
import { parseStructTag } from '@mysten/sui.js/utils'

export const getTokenSymbolAndNameFromTypeArg = (typeArg: string) => {
  const tag = parseStructTag(typeArg)

  const params = []
  for (const param of tag.typeParams) {
    if (typeof param === 'string') {
      params.push(param)
    } else {
      params.push(param.name)
    }
  }

  let name = tag.name
  if (params.length > 0) {
    name += `<${params.join(', ')}>`
  }

  return {
    name: name,
    symbol: tag.name,
  }
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
