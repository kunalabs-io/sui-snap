export class InvalidParamsError extends Error {
  static readonly type = 'INVALID_REQUEST_PARAMS'
  readonly type = InvalidParamsError.type

  constructor(message: string) {
    super(`${InvalidParamsError.type}: ${message}}`)
  }

  static asSimpleError(message: string) {
    return new Error(`${InvalidParamsError.type}: ${message}`)
  }

  static isSimpleErrorMessage(message: string) {
    return message.startsWith(InvalidParamsError.type + ': ')
  }

  static fromSimpleErrorMessage(message: string) {
    return new InvalidParamsError(message.slice(InvalidParamsError.type.length + 2))
  }
}

export class UserRejectionError extends Error {
  static readonly type = 'USER_REJECTION'
  readonly type = UserRejectionError.type

  constructor() {
    super(UserRejectionError.type)
  }

  static asSimpleError() {
    return new Error(UserRejectionError.type)
  }

  static isSimpleErrorMessage(message: string) {
    return message === UserRejectionError.type
  }
}

export class InvalidRequestMethodError extends Error {
  static readonly type = 'INVALID_REQUEST_METHOD'
  readonly type = InvalidRequestMethodError.type

  constructor(method: string) {
    super(`${InvalidRequestMethodError.type}: ${method}`)
  }

  static asSimpleError(method: string) {
    return new Error(`${InvalidRequestMethodError.type}: ${method}`)
  }

  static isSimpleErrorMessage(message: string) {
    return message.startsWith(InvalidRequestMethodError.type + ': ')
  }

  static fromSimpleErrorMessage(message: string) {
    return new InvalidRequestMethodError(message.slice(InvalidRequestMethodError.type.length + 2))
  }
}

function isMetaMaskError(obj: unknown): obj is { message: string } {
  return typeof obj === 'object' && obj !== null && 'message' in obj
}

export function convertError(error: unknown) {
  if (!isMetaMaskError(error)) {
    return error
  }

  if (InvalidParamsError.isSimpleErrorMessage(error.message)) {
    return InvalidParamsError.fromSimpleErrorMessage(error.message)
  } else if (UserRejectionError.isSimpleErrorMessage(error.message)) {
    return new UserRejectionError()
  } else if (InvalidRequestMethodError.isSimpleErrorMessage(error.message)) {
    return InvalidRequestMethodError.fromSimpleErrorMessage(error.message)
  }

  return error
}