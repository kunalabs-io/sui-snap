import { Type } from './type'
import { Amount } from './amount'

export interface CoinMetadataFields {
  id: string
  decimals: number
  name: string
  symbol: string
  description: string
  iconUrl?: string
}

export class CoinMetadata {
  readonly typeArg: Type
  readonly id: string
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
