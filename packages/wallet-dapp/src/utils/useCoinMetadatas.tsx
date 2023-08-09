import { useQuery } from '@tanstack/react-query'

import { CoinMetadata } from 'lib/framework/coin'
import { CoinMetadataLoader } from 'lib/framework/coin-metadata-loader'
import { Type } from 'lib/framework/type'

export interface UseCoinMetadataResult {
  meta: CoinMetadata
  isLoading: boolean
}

export const useCoinMetadatas = (coinTypes?: Type[]) => {
  const result = useQuery({
    queryKey: ['coinMetadatas', coinTypes],
    enabled: coinTypes !== undefined,
    staleTime: Infinity,
    cacheTime: Infinity,
    queryFn: async () => {
      if (coinTypes === undefined) throw new Error('coinTypes is undefined')
      return Promise.all(coinTypes?.map(ct => CoinMetadataLoader.loadMetadata(ct)))
    },
  })

  return {
    metas: result.data,
    isLoading: result.isLoading,
  }
}

export default useCoinMetadatas
