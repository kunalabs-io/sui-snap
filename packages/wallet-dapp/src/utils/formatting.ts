export const formatNumberWithCommas = (numberStr: string) => {
  return numberStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
