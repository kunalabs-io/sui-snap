import Button from 'components/Button/Button'
import IconButton from 'components/IconButton/IconButton'
import { IconCircle } from 'components/Icons/IconCircle'
import { IconClose } from 'components/Icons/IconClose'
import { IconCopy } from 'components/Icons/IconCopy'
import { IconExplore } from 'components/Icons/IconExplore'
import { IconSend } from 'components/Icons/IconSend'
import Select, { Option } from 'components/Select/Select'
import Typography from 'components/Typography/Typography'

const Main = () => {
  const handleClick = () => {
    console.log('click')
  }

  const handleOptionClick = (option: Option) => {
    console.log({ option })
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
      <div>
        <IconButton onClick={handleClick}>
          <IconSend />
        </IconButton>
        <IconButton onClick={handleClick}>
          <IconExplore />
        </IconButton>
      </div>
      <div style={{ height: 50 }} />

      <Typography variant="title" fontWeight="bold">
        Title
      </Typography>
      <Typography variant="subtitle1">Title</Typography>
      <Typography variant="subtitle2">Title</Typography>
      <Typography variant="description">Title</Typography>
      <Typography variant="body">Title</Typography>
      <Typography variant="caption">Title</Typography>

      <Select
        options={[
          { name: 'Mainnet', value: 'mainnet' },
          { name: 'Testnet', value: 'testnet' },
        ]}
        onOptionClick={handleOptionClick}
      />
    </div>
  )
}

export default Main
