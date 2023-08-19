import { useEffect, useReducer } from 'react'

import { initialState, reducer } from './tokenAmountInputReducer'

export const useInputAmountValidate = (inputValue: string, enforceDecimals: number) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    dispatch({ type: 'string_input_change', value: inputValue })
  }, [inputValue])

  useEffect(() => {
    dispatch({ type: 'enforce_decimals_change', value: enforceDecimals })
  }, [enforceDecimals])

  return {
    sanitizedInputValue: state.strAmount,
    amount: state.tokenAmount,
  }
}
