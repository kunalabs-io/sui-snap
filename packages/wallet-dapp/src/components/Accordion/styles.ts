import styled from 'styled-components'

export const AccordionContainer = styled.div`
  background-color: ${p => p.theme.colors.background.primary};
`

export const AccordionSummary = styled.div<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  font-size: ${p => p.theme.typography.size.Body}px;
  color: ${p => p.theme.colors.text.secondary};

  &:hover {
    cursor: pointer;
  }
`

export const AccordionDetails = styled.div<{ isOpen: boolean }>`
  height: 0px;
  opacity: 0;
  // transition: opacity 0.3s ease-in-out, height 0.3s 0.3s ease-in-out;
  overflow: hidden;
  ${p =>
    p.isOpen &&
    `
    opacity: 1;
    // transition: height 0.3s ease-in-out, opacity 0.3s 0.3s ease-in-out;
  `}
`

export const IconButton = styled.div<{ isOpen: boolean }>`
  margin-top: 3px;
  & > svg {
    transition: all 0.3s ease;
    transform: ${p => (p.isOpen ? 'rotate(180deg)' : 'rotate(90deg)')};
    fill: ${p => p.theme.colors.text.secondary};
  }
`
