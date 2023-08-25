import styled from 'styled-components'

export const ModalContainer = styled.div`
  padding: 16px;
  position: fixed;
  top: 300px;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1010;
  width: 400px;
  background-color: ${p => p.theme.colors.background.primary};
  border: 1px solid ${p => p.theme.colors.divider};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
`

export const ModalOverlay = styled.div`
  z-index: 1000;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: ${p => p.theme.colors.background.overlay};
`
