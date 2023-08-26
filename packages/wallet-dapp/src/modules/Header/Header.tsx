import Jazzicon, { jsNumberForAddress } from 'react-jazzicon'
import { useWalletKit } from '@mysten/wallet-kit'
import { useCallback, useState } from 'react'
import { useTheme } from 'styled-components'

import Typography from 'components/Typography/Typography'
import { Info, Wrapper } from './styles'
import { ellipsizeTokenAddress } from 'utils/helpers'
import Modal from 'components/Modal/Modal'
import ModalBody from 'components/Modal/components/ModalBody'
import {
  NETWORK,
  NETWORK_DEVNET,
  NETWORK_LOCAL,
  NETWORK_MAINNET,
  NETWORK_TESTNET,
  useNetwork,
} from 'utils/useNetworkProvider'
import { NetworkSelect, Option } from 'components/Select/Select'
import ModalActions from 'components/Modal/components/ModalActions'
import Button from 'components/Button/Button'
import { toast } from 'react-toastify'

const Header = () => {
  const { network, setNetwork } = useNetwork()
  const { currentAccount } = useWalletKit()

  const [isOpenInfoModal, setIsOpenInfoModal] = useState(false)

  const theme = useTheme()

  const handleAddressClick = useCallback(async () => {
    await navigator.clipboard.writeText(currentAccount?.address || '')
    toast.success('Address copied')
  }, [currentAccount?.address])

  const toggleModal = useCallback(() => {
    setIsOpenInfoModal(!isOpenInfoModal)
  }, [isOpenInfoModal])

  const handleOptionClick = (option: Option | null) => {
    if (option) {
      setNetwork(option.value as NETWORK)
    }
  }

  return (
    <Wrapper>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div onClick={toggleModal} style={{ cursor: 'pointer' }}>
          <Jazzicon diameter={25} seed={jsNumberForAddress(currentAccount?.address || '')} />
        </div>
        <div style={{ cursor: 'pointer' }} onClick={toggleModal}>
          <Typography variant="body-description" style={{ marginLeft: 12, color: theme.colors.text.description }}>
            {ellipsizeTokenAddress(currentAccount?.address || '')}
          </Typography>
        </div>
      </div>
      <div style={{ marginLeft: 'auto' }}>
        <NetworkSelect
          options={[
            { label: 'Mainnet', value: NETWORK_MAINNET },
            { label: 'Testnet', value: NETWORK_TESTNET },
            { label: 'Devnet', value: NETWORK_DEVNET },
            { label: 'Localnet', value: NETWORK_LOCAL },
          ]}
          handleChange={handleOptionClick}
          selectedOption={{
            label: network,
            value: network,
          }}
        />
      </div>
      {isOpenInfoModal && (
        <Modal onClose={toggleModal}>
          <ModalBody>
            <Typography variant="caption" style={{ marginBottom: 4, fontSize: '16px' }}>
              Your address:
            </Typography>
            <div onClick={handleAddressClick} style={{ cursor: 'pointer' }}>
              <Typography variant="body" style={{ wordWrap: 'break-word', fontSize: '17px' }} fontWeight="bold">
                {currentAccount?.address}
              </Typography>
            </div>
            <br />
            <Info>
              This address was generated from your MetaMask Secret Recovery Phrase using the{' '}
              <code>m/44&apos;/784&apos;/0&apos;/0&apos;/0&apos;</code> SLIP-10 derivation path for the{' '}
              <code>ed25519</code> curve.
              <br />
              <br />
              <div>
                This means that, if the access to your MetaMask wallet is lost, when you recover it using the Recovery
                Phrase, you will be able to access the same Sui address.
              </div>
            </Info>
          </ModalBody>
          <ModalActions style={{ textAlign: 'center' }}>
            <Button onClick={toggleModal}>Got it</Button>
          </ModalActions>
        </Modal>
      )}
    </Wrapper>
  )
}

export default Header
