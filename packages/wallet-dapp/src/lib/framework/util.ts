import { SuiMoveObject, is, ObjectCallArg, ObjectId, TransactionArgument, TransactionBlock } from '@mysten/sui.js'
import { Type } from './type'

export type ObjectArg = ObjectId | ObjectCallArg | TransactionArgument

export function obj(tx: TransactionBlock, arg: ObjectArg) {
  return is(arg, TransactionArgument) ? arg : tx.object(arg)
}

export interface FieldsWithTypes {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  fields: Record<string, any>
  type: string
}

export interface MoveObjectField {
  fields: Record<string, any>
  type: string
}

export type TypeInstanceDecoder<T> = (field: SuiMoveObject, type: Type) => T

export function idInstanceDecoder(field: SuiMoveObject): string {
  if (typeof field !== 'string') {
    throw new Error(`not an ID type`)
  }
  return field
}

export function uidInstanceDecoder(field: SuiMoveObject): string {
  if ('id' in field === false) {
    throw new Error(`not an UID type`)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (field as any).id
}

export function typeNameInstanceDecoder(field: any): string {
  if ('name' in field.fields === false) {
    throw new Error(`not a TypeName type`)
  }
  return field.fields.name
}
