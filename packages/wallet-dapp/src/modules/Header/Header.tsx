import Jazzicon from 'react-jazzicon'
import { useCallback, useState } from 'react'
import { useTheme } from 'styled-components'

import Typography from 'components/Typography/Typography'
import Select, { Option } from 'components/Select/Select'
import { Wrapper } from './styles'
import { ellipsizeTokenAddress } from 'utils/helpers'
import Modal from 'components/Modal/Modal'
import ModalTitle from 'components/Modal/components/ModalTitle'
import ModalBody from 'components/Modal/components/ModalBody'

const address = '0xcc2bd176a478baea9a0de7a24cd927661cc6e860d5bacecb9a138ef20dbab231'

const Header = () => {
  const [isOpenInfoModal, setIsOpenInfoModal] = useState(false)

  const theme = useTheme()

  const toggleModal = useCallback(() => {
    setIsOpenInfoModal(!isOpenInfoModal)
  }, [isOpenInfoModal])

  const handleOptionClick = (o: Option) => {
    console.log('handleOptionClick')
  }

  const handleAddressClick = useCallback(() => navigator.clipboard.writeText(address), [])

  return (
    <Wrapper>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div onClick={toggleModal} style={{ cursor: 'pointer' }}>
          <Jazzicon diameter={25} seed={Math.round(Math.random() * 10000000)} />
        </div>
        <div style={{ cursor: 'pointer' }} onClick={handleAddressClick}>
          <Typography variant="body" style={{ marginLeft: 12, color: theme.colors.text.description }}>
            {ellipsizeTokenAddress(address)}
          </Typography>
        </div>
      </div>
      <Select
        options={[
          { name: 'Mainnet', value: 'mainnet' },
          { name: 'Testnet', value: 'testnet' },
        ]}
        onOptionClick={handleOptionClick}
      />
      {isOpenInfoModal && (
        <Modal onClose={toggleModal}>
          <ModalTitle onClose={toggleModal}>Info</ModalTitle>
          <ModalBody>Info details</ModalBody>
        </Modal>
      )}
    </Wrapper>
  )
}

export default Header
