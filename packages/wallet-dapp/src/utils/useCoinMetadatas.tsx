import { useQueries } from '@tanstack/react-query'

import { CoinMetadata } from 'lib/coin'
import { Type, tagToType } from 'lib/type'
import { ONE_DAY } from './const'
import { getTokenSymbolAndNameFromTypeArg } from './helpers'
import { useNetwork } from './useNetworkProvider'
import { useCurrentClient } from '@mysten/dapp-kit-react'

export interface UseCoinMetadataResult {
  meta: CoinMetadata
  isLoading: boolean
}

export const useCoinMetadatas = (coinTypes: Type[]) => {
  const suiClient = useCurrentClient()
  const { network } = useNetwork()

  const fetchCoinMetadata = async (ct: Type) => {
    let typeStr: string
    if (typeof ct === 'string') {
      typeStr = ct
    } else {
      typeStr = tagToType(ct)
    }
    const { coinMetadata } = await suiClient.core.getCoinMetadata({ coinType: typeStr })
    if (coinMetadata === null) {
      const { symbol, name } = getTokenSymbolAndNameFromTypeArg(typeStr)
      return new CoinMetadata(typeStr, {
        id: '',
        decimals: 0,
        name,
        symbol,
        description: '',
      })
    }
    return new CoinMetadata(typeStr, {
      id: coinMetadata.id ?? '',
      decimals: coinMetadata.decimals,
      name: coinMetadata.name,
      symbol: coinMetadata.symbol,
      description: coinMetadata.description,
      iconUrl: coinMetadata.iconUrl ?? undefined,
    })
  }

  const results = useQueries({
    queries: coinTypes.map(ct => ({
      queryKey: ['coinMetadatas', ct, network],
      queryFn: () => fetchCoinMetadata(ct),
      staleTime: ONE_DAY,
      cacheTime: ONE_DAY,
    })),
  })

  return {
    metas: results.map(r => r.data),
    isLoading: results.some(r => r.isLoading),
  }
}

export default useCoinMetadatas
