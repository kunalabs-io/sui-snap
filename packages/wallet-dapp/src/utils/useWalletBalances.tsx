import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query'

import { Type } from 'lib/type'
import { Amount } from 'lib/amount'
import { CoinMetadata } from 'lib/coin'

import useCoinMetadatas from './useCoinMetadatas'
import { useNetwork } from './useNetworkProvider'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'

export interface CoinInfo {
  amount: Amount
  meta: CoinMetadata
}

export interface WalletBalanceInfos {
  infos?: Map<Type, CoinInfo>
  isLoading: boolean
  triggerUpdate: () => void
}

export const useWalletBalances = (options?: { refetchInterval: number }): WalletBalanceInfos => {
  const suiClient = useSuiClient()
  const currentAccount = useCurrentAccount()
  const { network } = useNetwork()

  const balancesRes = useQuery({
    queryKey: ['wallet-balances', currentAccount?.address, network],
    enabled: !!currentAccount?.address,
    queryFn: async () => {
      if (!currentAccount?.address) {
        throw new Error('invariant violation')
      }

      const balances = new Map<Type, bigint>()
      const res = await suiClient.getAllBalances({ owner: currentAccount?.address })
      res.forEach(balance => {
        balances.set(balance.coinType, BigInt(balance.totalBalance))
      })
      return balances
    },
    refetchInterval: options?.refetchInterval,
  })
  const balances = balancesRes.data

  const coinTypes = []
  for (const key of balances?.keys() || []) {
    coinTypes.push(key)
  }

  const { metas, isLoading: metasAreLoading } = useCoinMetadatas(coinTypes)

  const isLoading = balancesRes.isLoading || metasAreLoading

  let infos: Map<Type, CoinInfo> | undefined
  if (coinTypes !== undefined && metas !== undefined && balances !== undefined) {
    infos = new Map()
    for (const type of coinTypes) {
      const meta = metas.find(m => m?.typeArg === type)
      if (meta) {
        const value = balances.get(type) || 0n
        infos.set(type, { amount: meta.newAmount(value), meta })
      }
    }
  }

  const queryClient = useQueryClient()
  const triggerUpdate = () => {
    void queryClient.invalidateQueries({
      queryKey: ['wallet-balances'],
    })
  }

  return {
    infos,
    isLoading,
    triggerUpdate,
  }
}

export async function invalidateWalletBalances(client: QueryClient) {
  await client.invalidateQueries({
    predicate: query => {
      return query.queryKey[0] === 'wallet-balances'
    },
  })
}
