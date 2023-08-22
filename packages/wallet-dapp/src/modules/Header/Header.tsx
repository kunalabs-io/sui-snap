import { toast } from 'react-toastify'
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon'
import { useWalletKit } from '@mysten/wallet-kit'
import { useCallback, useState } from 'react'
import { useTheme } from 'styled-components'

import Typography from 'components/Typography/Typography'
import { Wrapper } from './styles'
import { ellipsizeTokenAddress, getNetworkFromUrl } from 'utils/helpers'
import Modal from 'components/Modal/Modal'
import ModalTitle from 'components/Modal/components/ModalTitle'
import ModalBody from 'components/Modal/components/ModalBody'
import { devnetConnectionUrl, mainnetConnectionUrl, testnetConnectionUrl } from 'utils/const'
import { useNetwork } from 'utils/useNetworkProvider'
import { NetworkSelect, Option } from 'components/Select/Select'

const Header = () => {
  const { network, setNetwork } = useNetwork()
  const { currentAccount } = useWalletKit()

  const [isOpenInfoModal, setIsOpenInfoModal] = useState(false)

  const theme = useTheme()

  const toggleModal = useCallback(() => {
    setIsOpenInfoModal(!isOpenInfoModal)
  }, [isOpenInfoModal])

  const handleOptionClick = (option: Option | null) => {
    if (option) {
      setNetwork(option.value)
    }
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
      <NetworkSelect
        options={[
          { label: 'Mainnet', value: mainnetConnectionUrl },
          { label: 'Testnet', value: testnetConnectionUrl },
          { label: 'Devnet', value: devnetConnectionUrl },
        ]}
        handleChange={handleOptionClick}
        selectedOption={{
          label: getNetworkFromUrl(network),
          value: network,
        }}
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
