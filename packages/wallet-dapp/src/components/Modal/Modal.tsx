import React, { ReactNode, useRef } from 'react'

import { ModalContainer, ModalOverlay } from './styles'
import { useOnClickOutside } from 'utils/hooks'

interface Props {
  children: ReactNode
  onClose: () => void
  style?: React.CSSProperties
}

const Modal = ({ children, onClose, style }: Props) => {
  // we need ref to modal so we can detect click outside of modal and close it
  const node = useRef<HTMLDivElement>(null)

  useOnClickOutside(node, onClose)

  return (
    <>
      <div ref={node}>
        <ModalContainer style={style}>{children}</ModalContainer>
      </div>
      <ModalOverlay />
    </>
  )
}

export default Modal
