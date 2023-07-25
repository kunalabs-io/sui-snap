import Button from 'components/Button/Button'
import { IconCircle } from 'components/Icons/IconCircle'
import { IconClose } from 'components/Icons/IconClose'
import { IconCopy } from 'components/Icons/IconCopy'
import { IconExplore } from 'components/Icons/IconExplore'
import { IconSend } from 'components/Icons/IconSend'

const Main = () => {
  const handleClick = () => {
    console.log('click')
  }
  return (
    <div style={{ marginTop: 39, marginLeft: 40 }}>
      <Button onClick={handleClick} style={{ marginTop: 39 }}>
        Send
      </Button>
      <Button onClick={handleClick} style={{ marginTop: 39 }} disabled>
        Send
      </Button>
      <div>
        <Button onClick={handleClick} style={{ marginTop: 39 }} variant="outlined">
          Reject
        </Button>
        <Button onClick={handleClick} style={{ marginTop: 39 }} variant="outlined" disabled>
          Reject
        </Button>
      </div>
      <div style={{ backgroundColor: '#000000' }}>
        <IconSend />
        <IconExplore />
        <IconCircle />
        <IconClose fill="#ffffff" />
        <IconCopy />
      </div>
    </div>
  )
}

export default Main
