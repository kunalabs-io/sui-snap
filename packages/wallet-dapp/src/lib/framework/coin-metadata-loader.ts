import { Connection, JsonRpcProvider, TypeTag } from '@mysten/sui.js'
import { tagToType } from './type'
import { CoinMetadata } from './coin'

const provider = new JsonRpcProvider(
  new Connection({
    fullnode: 'https://api.shinami.com/node/v1/sui_testnet_479b90cf2da0346bf97e132d2f1c659b',
  })
)
const cache = new Map<string, CoinMetadata>()
const negativeCache = new Set<string>()

export class CoinMetadataLoader {
  static async loadMetadata(type: TypeTag | string): Promise<CoinMetadata> {
    let typeStr: string
    if (typeof type === 'string') {
      typeStr = type
    } else {
      typeStr = tagToType(type)
    }

    if (cache.has(typeStr)) {
      return cache.get(typeStr)!
    }
    if (negativeCache.has(typeStr)) {
      throw new Error(`no metadata for ${typeStr}`)
    }

    try {
      const res = await provider.getCoinMetadata({
        coinType: typeStr,
      })
      if (res === null) {
        negativeCache.add(typeStr)
        throw new Error(`no metadata for ${typeStr}`)
      }

      const metadata = new CoinMetadata(typeStr, {
        id: res.id!,
        decimals: res.decimals,
        name: res.name,
        symbol: res.symbol,
        description: res.description,
        iconUrl: res.iconUrl || undefined,
      })

      cache.set(typeStr, metadata)

      return metadata
    } catch (e) {
      throw new Error(`failed to load metadata for type ${typeStr}`)
    }
  }
}
