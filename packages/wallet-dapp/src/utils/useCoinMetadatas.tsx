import { useQueries } from '@tanstack/react-query'

import { CoinMetadata } from 'lib/framework/coin'
import { Type, tagToType } from 'lib/framework/type'
import { useSuiClientProvider } from './useSuiClientProvider'
import { ONE_DAY } from './const'
import { getTokenSymbolFromTypeArg } from './helpers'

export interface UseCoinMetadataResult {
  meta: CoinMetadata
  isLoading: boolean
}

export const useCoinMetadatas = (coinTypes: Type[]) => {
  const suiClient = useSuiClientProvider()

  const fetchCoinMetadata = async (ct: Type) => {
    let typeStr: string
    if (typeof ct === 'string') {
      typeStr = ct
    } else {
      typeStr = tagToType(ct)
    }
    const res = await suiClient.getCoinMetadata({ coinType: typeStr })
    if (res === null) {
      const coinSymbol = getTokenSymbolFromTypeArg(typeStr)
      return new CoinMetadata(typeStr, {
        id: '',
        decimals: 0,
        name: coinSymbol,
        symbol: coinSymbol,
        description: '',
      })
    } else {
      return new CoinMetadata(typeStr, {
        id: res.id!,
        decimals: res.decimals,
        name: res.name,
        symbol: res.symbol,
        description: res.description,
        iconUrl: res.iconUrl || undefined,
      })
    }
  }

  const results = useQueries({
    queries: coinTypes.map(ct => ({
      queryKey: ['coinMetadatas', ct],
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
