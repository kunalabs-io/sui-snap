export const formatNumberWithCommas = (numberStr: string) => {
  if (!numberStr) {
    return ''
  }
  const number = Number(numberStr)
  if (Number.isFinite(number) === false) return numberStr
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 15,
  }).format(number)
}
