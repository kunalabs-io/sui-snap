export function countDecimals(value: string) {
  let decimals = 0
  const decPos = value.indexOf('.')
  if (decPos > 0) {
    decimals = value.length - decPos - 1
  }

  return decimals
}

export function limitToDecimals(value: string, maxDecimals: number) {
  const decPos = value.indexOf('.')
  if (maxDecimals == 0 && decPos >= 0) {
    return value.slice(0, decPos)
  }

  const decimals = countDecimals(value)

  if (decimals && decimals > maxDecimals) {
    const shortenFor = decimals - maxDecimals
    return value.slice(0, value.length - shortenFor)
  }

  return value
}

export function cleanNumberInput(value: string, maxDecimals?: number): string {
  // remove non-numbers and multiple decimal points
  let hasDecimalPoint = false
  let result = ''
  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    if (char === '.') {
      if (hasDecimalPoint) {
        continue
      }
      result += '.'
      hasDecimalPoint = true
    }

    if (char >= '0' && char <= '9') {
      result += char
    }
  }

  // remove leading zeroes
  let firstNonZero = -1
  for (let i = 0; i < result.length; i++) {
    const char = result[i]
    firstNonZero++
    if (char !== '0') {
      break
    }
  }
  if (firstNonZero !== -1) {
    result = result.slice(firstNonZero)
  }

  // add 0 before "." if needed
  if (result.startsWith('.')) {
    result = '0' + result
  }

  // limit to decimals
  if (maxDecimals !== undefined) {
    result = limitToDecimals(result, maxDecimals)
  }

  return result
}
