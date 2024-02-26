import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { KioskData } from '@mysten/kiosk'

import Spinner from 'components/Spinner'
import { useKioskObjects } from 'utils/useKioskObjects'
import { Kiosk } from './Kiosk'
import { KioskDetails } from './KioskDetails'

const Container = styled.div<{ isScrollable: boolean }>`
  padding-top: 16px;
  padding-left: 24px;
  padding-right: 24px;
  display: flex;
  ${p => (p.isScrollable ? `flex-wrap: wrap; gap: 8px` : `justify-content: space-between`)}
`

const EmptyList = styled.div`
  padding: 24px;
  text-align: center;
  color: ${p => p.theme.colors.text.secondary};
`

export const KioskContainer = () => {
  const [activeKiosk, setActiveKiosk] = useState<KioskData>()
  const { isLoading, ownedKiosks } = useKioskObjects()

  const toggleKioskModal = useCallback((kiosk?: KioskData) => {
    setActiveKiosk(kiosk)
  }, [])

  if (isLoading) {
    return <Spinner style={{ marginTop: 48 }} />
  }

  if (!ownedKiosks) {
    return null
  }

  if (ownedKiosks && ownedKiosks.length === 0) {
    return <EmptyList>The list is currently empty.</EmptyList>
  }

  return (
    <>
      <Container isScrollable={ownedKiosks.length > 2}>
        {ownedKiosks.map(k => {
          const kioskImages = k.items.map(i => i.data?.display?.data?.image_url)
          if (!kioskImages || kioskImages.length === 0) {
            return null
          }
          return (
            <div key={k.kiosk?.id}>
              <Kiosk kiosk={k} showImgInfoOnHover toggleModal={toggleKioskModal} />
            </div>
          )
        })}
      </Container>
      {activeKiosk && <KioskDetails kiosk={activeKiosk} toggleModal={toggleKioskModal} />}
    </>
  )
}
