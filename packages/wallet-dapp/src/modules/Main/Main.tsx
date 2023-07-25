import Button from 'components/Button/Button'

const Main = () => {
  const handleClick = () => {
    console.log('dsada')
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
    </div>
  )
}

export default Main
