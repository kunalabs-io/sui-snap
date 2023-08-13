import { useQuery } from '@tanstack/react-query'

import { CoinMetadata } from 'lib/framework/coin'
import { Type, tagToType } from 'lib/framework/type'
import { useSuiClientProvider } from './useSuiClientProvider'
import { ONE_DAY } from './const'
import { getTokenSymbolFromTypeArg } from './tokenSymbol'

export interface UseCoinMetadataResult {
  meta: CoinMetadata
  isLoading: boolean
}

export const useCoinMetadatas = (coinTypes?: Type[]) => {
  const suiClient = useSuiClientProvider()

  const queryFunction = async () => {
    if (coinTypes === undefined) throw new Error('coinTypes is undefined')
    return Promise.all(
      coinTypes?.map(async ct => {
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
      })
    )
  }

  const result = useQuery({
    queryKey: ['coinMetadatas', coinTypes],
    enabled: coinTypes !== undefined,
    staleTime: ONE_DAY,
    cacheTime: ONE_DAY,
    queryFn: queryFunction,
  })

  return {
    metas: result.data,
    isLoading: result.isLoading,
  }
}

export default useCoinMetadatas
