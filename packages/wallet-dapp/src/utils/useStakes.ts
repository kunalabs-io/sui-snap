import { QueryClient, useQuery } from '@tanstack/react-query'
import { useNetwork } from './useNetworkProvider'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'

export const useStakes = () => {
  const client = useSuiClient()
  const currentAccount = useCurrentAccount()

  const { network } = useNetwork()
  client.getStakesByIds

  const result = useQuery({
    queryKey: ['stakes', currentAccount?.address, network],
    enabled: !!currentAccount?.address,
    queryFn: async () => {
      const address = currentAccount!.address
      const res = await client.getStakes({ owner: address })
      return res
    },
    refetchInterval: 1000 * 10, // 10 seconds
  })

  return result
}

export async function invalidateStakes(client: QueryClient) {
  await client.invalidateQueries({
    predicate: query => {
      return query.queryKey[0] === 'stakes'
    },
  })
}

export default useStakes
