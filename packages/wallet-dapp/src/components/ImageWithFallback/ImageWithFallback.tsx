import { CSSProperties, useCallback, useEffect, useState } from 'react'

import { IconMissingImg, IconMissingImgSmall } from 'components/Icons/IconMissingImg'
import { Stylable } from 'utils/types'

interface Props extends Stylable {
  isSmallPlaceholder?: boolean
  src?: string
  alt: string
  placeholderStyles?: CSSProperties
}

const ImageWithFallback = (props: Props) => {
  const [showPlaceholder, setShowPlaceholder] = useState(false)

  useEffect(() => setShowPlaceholder(!props.src), [props.src])

  const handleImageLoaded = useCallback(() => setShowPlaceholder(false), [])

  const handleImageLoadError = useCallback(() => setShowPlaceholder(true), [])

  return showPlaceholder ? (
    props.isSmallPlaceholder ? (
      <IconMissingImgSmall style={props.placeholderStyles} />
    ) : (
      <IconMissingImg style={props.placeholderStyles} />
    )
  ) : (
    <img hidden={showPlaceholder} onLoad={handleImageLoaded} onError={handleImageLoadError} {...props} />
  )
}

export default ImageWithFallback
