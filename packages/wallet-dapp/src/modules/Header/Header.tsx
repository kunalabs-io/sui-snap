import { toast } from 'react-toastify'
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon'
import { useWalletKit } from '@mysten/wallet-kit'
import { useCallback, useState } from 'react'
import { useTheme } from 'styled-components'

import Typography from 'components/Typography/Typography'
import Select from 'components/Select/Select'
import { Wrapper } from './styles'
import { ellipsizeTokenAddress } from 'utils/helpers'
import Modal from 'components/Modal/Modal'
import ModalTitle from 'components/Modal/components/ModalTitle'
import ModalBody from 'components/Modal/components/ModalBody'
import { devnetConnectionUrl, mainnetConnectionUrl, testnetConnectionUrl } from 'utils/const'
import { useNetwork } from 'utils/useNetworkProvider'

const Header = () => {
  const { network, setNetwork } = useNetwork()
  const { currentAccount } = useWalletKit()

  const [isOpenInfoModal, setIsOpenInfoModal] = useState(false)

  const theme = useTheme()

  const toggleModal = useCallback(() => {
    setIsOpenInfoModal(!isOpenInfoModal)
  }, [isOpenInfoModal])

  const handleOptionClick = (option: string) => {
    setNetwork(option)
  }

  const handleAddressClick = useCallback(async () => {
    await navigator.clipboard.writeText(currentAccount?.address || '')
    toast.success('Address copied')
  }, [currentAccount?.address])

  return (
    <Wrapper>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div onClick={toggleModal} style={{ cursor: 'pointer' }}>
          <Jazzicon diameter={25} seed={jsNumberForAddress(currentAccount?.address || '')} />
        </div>
        <div style={{ cursor: 'pointer' }} onClick={handleAddressClick}>
          <Typography variant="body" style={{ marginLeft: 12, color: theme.colors.text.description }}>
            {ellipsizeTokenAddress(currentAccount?.address || '')}
          </Typography>
        </div>
      </div>
      <Select
        options={[
          { name: 'Mainnet', value: mainnetConnectionUrl },
          { name: 'Testnet', value: testnetConnectionUrl },
          { name: 'Devnet', value: devnetConnectionUrl },
        ]}
        onOptionClick={handleOptionClick}
        selectedOption={network}
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
