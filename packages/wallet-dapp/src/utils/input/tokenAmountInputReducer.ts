import { Amount } from 'lib/amount'
import { cleanNumberInput, countDecimals, limitToDecimals } from './input'

export const initialState: State = {
  tokenAmount: undefined,
  strAmount: '',
  enforceDecimals: undefined,
}

export interface State {
  tokenAmount: Amount | undefined
  strAmount: string
  enforceDecimals: number | undefined
}

interface StringInputChange {
  type: 'string_input_change'
  value: string
}

interface EnforceDecimalsChange {
  type: 'enforce_decimals_change'
  value: number | undefined
}

type Action = StringInputChange | EnforceDecimalsChange

function truncateDecimals(num: string, decimals: number): string {
  const [int, dec] = num.split('.')
  if (decimals === 0) {
    return int
  }
  if (!dec || dec.length <= decimals) {
    return num
  }
  return `${int}.${dec.slice(0, decimals)}`
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'string_input_change': {
      const cleanAmount = cleanNumberInput(action.value, state.enforceDecimals)
      if (cleanAmount === '') {
        return {
          ...state,
          tokenAmount: undefined,
          strAmount: '',
        }
      }

      const decimals = state.enforceDecimals !== undefined ? state.enforceDecimals : countDecimals(cleanAmount)

      let nextAmount = Amount.fromNum(cleanAmount, decimals)
      if (state.tokenAmount && state.tokenAmount.equals(nextAmount)) {
        nextAmount = state.tokenAmount
      }

      return {
        ...state,
        strAmount: cleanAmount,
        tokenAmount: nextAmount,
      }
    }
    case 'enforce_decimals_change': {
      if (action.value === undefined) {
        let nextAmount = undefined
        if (state.tokenAmount) {
          nextAmount = Amount.fromNum(state.strAmount, countDecimals(state.strAmount))
          if (nextAmount.equals(state.tokenAmount)) {
            nextAmount = state.tokenAmount
          }
        }

        return {
          ...state,
          enforceDecimals: undefined,
          tokenAmount: nextAmount,
        }
      }

      if (state.tokenAmount === undefined) {
        return {
          ...state,
          enforceDecimals: action.value,
        }
      }

      if (state.enforceDecimals === undefined || action.value < state.enforceDecimals) {
        let nextAmount = Amount.fromNum(truncateDecimals(state.tokenAmount.toString(), action.value), action.value)
        if (nextAmount.equals(state.tokenAmount)) {
          nextAmount = state.tokenAmount
        }

        return {
          ...state,
          tokenAmount: nextAmount,
          strAmount: limitToDecimals(state.strAmount, action.value),
          enforceDecimals: action.value,
        }
      }

      if (action.value > state.tokenAmount.decimals) {
        return {
          ...state,
          tokenAmount: Amount.fromNum(state.tokenAmount.toString(), action.value),
          enforceDecimals: action.value,
        }
      }

      return {
        ...state,
        enforceDecimals: action.value,
      }
    }
  }
}
