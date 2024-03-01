export const formatImgUrl = (imgSrc?: string) => {
  if (!imgSrc) {
    return ''
  }
  if (imgSrc.startsWith('ipfs://')) {
    return imgSrc.replace('ipfs://', 'https://ipfs.io/ipfs/')
  }
  return imgSrc
}
