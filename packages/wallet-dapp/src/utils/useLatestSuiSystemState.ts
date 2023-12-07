import { useQuery } from '@tanstack/react-query'
import { useSuiClientProvider } from './useSuiClientProvider'
import { useNetwork } from './useNetworkProvider'

export const useLatestSuiSystemState = () => {
  const client = useSuiClientProvider()
  const { network } = useNetwork()

  const result = useQuery({
    queryKey: ['latestSuiSystemState', network],
    queryFn: async () => {
      const [systemState, apys] = await Promise.all([
        client.getLatestSuiSystemState(),
        client.getValidatorsApy(),
      ])

      const apyMap = new Map<string, number>()
      for (const apy of apys.apys) {
        apyMap.set(apy.address, apy.apy)
      }

      return {
        systemState,
        apys,
        apyMap,
      }
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    cacheTime: 1000 * 60 * 1, // 1 minute
  })

  return result
}

export default useLatestSuiSystemState
