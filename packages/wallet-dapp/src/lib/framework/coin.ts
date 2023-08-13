import { ObjectId, Coin as SuiCoin, TypeTag, StructTag, SuiObjectResponse, SuiParsedData } from '@mysten/sui.js'
import { tagToType, Type, typeToTag } from './type'
import { Balance } from './balance'
import { MoveObjectField } from './util'
import { Amount } from './amount'

export interface CoinMetadataFields {
  id: ObjectId
  decimals: number
  name: string
  symbol: string
  description: string
  iconUrl?: string
}

export class CoinMetadata {
  readonly typeArg: Type
  readonly id: ObjectId
  readonly decimals: number
  readonly name: string
  readonly symbol: string
  readonly description: string
  readonly iconUrl?: string

  constructor(typeArg: Type, fields: CoinMetadataFields) {
    this.typeArg = typeArg
    this.id = fields.id
    this.decimals = fields.decimals
    this.name = fields.name
    this.symbol = fields.symbol
    this.description = fields.description
    this.iconUrl = fields.iconUrl
  }

  newAmount(value: bigint): Amount {
    return Amount.fromInt(value, this.decimals)
  }
}

export class Coin {
  readonly typeArg: Type
  readonly id: ObjectId
  readonly balance: Balance

  constructor(typeArg: Type, id: ObjectId, balance: bigint) {
    this.typeArg = typeArg
    this.id = id
    this.balance = new Balance(typeArg, balance)
  }

  static fromSuiParsedData(content: SuiParsedData): Coin {
    if (content.dataType !== 'moveObject') {
      throw new Error(`not an object`)
    }
    if (!isCoin(content.type)) {
      throw new Error(`not a Coin type`)
    }
    return this.fromMoveObjectField(content)
  }

  static fromMoveObjectField(field: MoveObjectField): Coin {
    if (!isCoin(field.type)) {
      throw new Error(`not a Coin type`)
    }
    const struct = (typeToTag(field.type) as { struct: StructTag }).struct
    const [type] = (struct.typeParams as [TypeTag]).map(tagToType)

    return new Coin(type, field.fields.id, BigInt(field.fields.balance))
  }
}

export function isCoin(type: Type) {
  return type.startsWith('0x2::coin::Coin<')
}

export function suiCoinToCoin(coin: SuiObjectResponse): Coin {
  if (!SuiCoin.isCoin(coin)) {
    throw new Error('Not a Coin')
  }
  return new Coin(SuiCoin.getCoinTypeArg(coin)!, SuiCoin.getID(coin), SuiCoin.getBalance(coin)!)
}

export function totalBalance(coins: Coin[]): bigint {
  return coins.reduce((acc, coin) => acc + coin.balance.value, BigInt(0))
}

export function selectCoinWithBalanceGreaterThanOrEqual(coins: Coin[], balance: bigint): Coin | undefined {
  return coins.find(coin => coin.balance.value >= balance)
}

export function sortByBalance(coins: Coin[]): Coin[] {
  return coins.sort((a, b) => {
    if (a.balance.value < b.balance.value) {
      return -1
    } else if (a.balance.value > b.balance.value) {
      return 1
    } else {
      return 0
    }
  })
}

export function selectCoinsWithBalanceGreaterThanOrEqual(coins: Coin[], balance: bigint): Coin[] {
  return sortByBalance(coins.filter(coin => coin.balance.value >= balance))
}

export function selectCoinSetWithCombinedBalanceGreaterThanOrEqual(coins: Coin[], amount: bigint): Coin[] {
  const sortedCoins = sortByBalance(coins)

  const total = totalBalance(sortedCoins)
  // return empty set if the aggregate balance of all coins is smaller than amount
  if (total < amount) {
    return []
  } else if (total === amount) {
    return sortedCoins
  }

  let sum = BigInt(0)
  const ret = []
  while (sum < total) {
    // prefer to add a coin with smallest sufficient balance
    const target = amount - sum
    const coinWithSmallestSufficientBalance = sortedCoins.find(c => c.balance.value >= target)
    if (coinWithSmallestSufficientBalance) {
      ret.push(coinWithSmallestSufficientBalance)
      break
    }

    const coinWithLargestBalance = sortedCoins.pop()!
    ret.push(coinWithLargestBalance)
    sum += coinWithLargestBalance.balance.value
  }

  return sortByBalance(ret)
}

/// Returns a list of unique coin types.
export function getUniqueCoinTypes(coins: Coin[]): Type[] {
  return [...new Set(coins.map(coin => coin.typeArg))]
}

/// Returns a map from coin type to the total balance of coins of that type.
export function getCoinBalances(coins: Coin[]): Map<Type, bigint> {
  const balances = new Map<Type, bigint>()
  for (const coin of coins) {
    const balance = balances.get(coin.typeArg)
    if (balance === undefined) {
      balances.set(coin.typeArg, coin.balance.value)
    } else {
      balances.set(coin.typeArg, balance + coin.balance.value)
    }
  }
  return balances
}
