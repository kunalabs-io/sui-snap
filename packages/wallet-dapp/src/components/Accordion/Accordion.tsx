import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { AccordionContainer, AccordionDetails, AccordionSummary, IconButton } from './styles'

import { IconCaret } from 'components/Icons/IconCaret'

interface Props {
  isOpenInitial?: boolean
  accordionSummary: ReactNode
  accordionDetails: ReactNode
}

const Accordion = ({ accordionSummary, accordionDetails, isOpenInitial }: Props) => {
  const [isOpen, setIsOpen] = useState(!!isOpenInitial)
  const [height, setHeight] = useState<number | undefined>()

  // This ref is needed for proper height detection
  const accordionBodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHeight(accordionBodyRef.current?.scrollHeight)
  }, [])

  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  return (
    <AccordionContainer>
      <AccordionSummary isOpen={isOpen} onClick={toggle}>
        {accordionSummary}
        <IconButton isOpen={isOpen} style={{ marginLeft: 4 }}>
          <IconCaret width={12} height={12} />
        </IconButton>
      </AccordionSummary>
      <AccordionDetails style={{ height: isOpen ? `${height}px` : 0 }} ref={accordionBodyRef} isOpen={isOpen}>
        {accordionDetails}
      </AccordionDetails>
    </AccordionContainer>
  )
}

export default Accordion
