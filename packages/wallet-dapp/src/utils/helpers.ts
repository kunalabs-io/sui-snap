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

export const ellipsizeTokenAddress = (tokenAddress: string, charStartEndNum = 5) => {
  if (tokenAddress.length <= charStartEndNum * 2) {
    return tokenAddress
  }
  return `${tokenAddress.substring(0, charStartEndNum)}...${tokenAddress.substring(
    tokenAddress.length - charStartEndNum,
    tokenAddress.length
  )}`
}

export const getPackageIdFromTypeArg = (typeArg: string, separator = '::') => {
  const firstIndexOfSeparator = typeArg.indexOf(separator)
  if (firstIndexOfSeparator >= 0) {
    return typeArg.substring(0, firstIndexOfSeparator)
  }
  return ''
}
