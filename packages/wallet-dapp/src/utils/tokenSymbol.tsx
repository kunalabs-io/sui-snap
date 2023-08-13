export const getTokenSymbolFromTypeArg = (typeArg: string, separator = '::') => {
  const lastIndexOfSeparator = typeArg.indexOf(separator)
  if (lastIndexOfSeparator >= 0) {
    return typeArg.substring(lastIndexOfSeparator + separator.length)
  }

  return ''
}
