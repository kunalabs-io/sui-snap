export const formatNumberWithCommas = (numberStr: string) => {
  if (!numberStr) {
    return ''
  }
  let number = Number(numberStr)
  if (Number.isFinite(number) === false) return numberStr

  if (number < 1e6) {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 15,
    }).format(number)
  } else if (number < 1e9) {
    number = Number(number) / 1e6
    const numStr = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(number)
    return `${numStr} M`
  } else {
    number = Number(number) / 1e9
    const numStr = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(number)
    return `${numStr} B`
  }
}

export const roundNumber = (n: number, decimals: number) => {
  if (Number.isFinite(n) === false) return n
  const factor = 10 ** decimals
  return Math.round(n * factor) / factor
}

export const formatNumberToPct = (n: number, decimals: number, fixDecimals = false) => {
  if (fixDecimals) {
    return `${(n * 100).toFixed(decimals)}%`
  } else {
    return `${roundNumber(n * 100, decimals)}%`
  }
}
