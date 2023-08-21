export const suiTypeArg = '0x2::sui::SUI'

export const testnetConnectionUrl = 'https://fullnode.testnet.sui.io:443/'

export const devnetConnectionUrl = 'https://fullnode.devnet.sui.io:443/'

export const mainnetConnectionUrl = 'https://fullnode.mainnet.sui.io:443/'

export const WALLET_BALANCES_REFETCH_INTERVAL = 10000

export const ONE_DAY = 1000 * 60 * 60 * 24

const recognizedTokensPackageIdsArr = [
  '0x2',
  '0x3',
  '0xa198f3be41cda8c07b3bf3fee02263526e535d682499806979a111e88a5a8d0f',
  '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881',
  '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf',
  '0xe32d3ebafa42e6011b87ef1087bbc6053b499bf6f095807b9013aff5a6ecd7bb',
  '0x909cba62ce96d54de25bec9502de5ca7b4f28901747bbf96b76c2e63ec5f1cba',
  '0xcf72ec52c0f8ddead746252481fb44ff6e8485a39b803825bde6b00d77cdb0bb',
  '0xb231fcda8bbddb31f2ef02e6161444aec64a514e2c89279584ac9806ce9cf037',
  '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c',
  '0x1e8b532cca6569cab9f9b9ebc73f8c13885012ade714729aa3b450e0339ac766',
  '0xb848cce11ef3a8f62eccea6eb5b35a12c4c2b1ee1af7755d02d7bd6218e8226f',
  '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881',
  '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5',
  '0x6081300950a4f1e2081580e919c210436a1bed49080502834950d31ee55a2396',
  '0x66f87084e49c38f76502d17f87d17f943f183bb94117561eb573e075fdc5ff75',
  '0xdbe380b13a6d0f5cdedd58de8f04625263f113b3f9db32b3e1983f49e2841676',
  '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8',
  '0x6864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b',
  '0x1d58e26e85fbf9ee8596872686da75544342487f95b1773be3c9a49ab1061b19',
  '0xe4239cd951f6c53d9c41e25270d80d31f925ad1655e5ba5b543843d4a66975ee',
  '0x5d1f47ea69bb0de31c313d7acf89b890dbb8991ea8e03c6c355171f84bb1ba4a',
]

export const RECOGNIZED_TOKENS_PACKAGE_IDS = new Set(recognizedTokensPackageIdsArr)
