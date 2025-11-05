import "whatwg-fetch";

function getErrorMessage(httpResponse: any, body?: any): string {
  if (body && body.error && body.error.message) {
    return body.error.message;
  } else if (body && body.message) {
    return body.message;
  } else {
    return httpResponse.statusText || httpResponse.message;
  }
}

/**
 * Our own Error class
 */
export class FetchError extends Error {
  constructor(public httpResponse: any, public body?: any) {
    // Bluebird is testing typeof message property. Undefined is causing the "promise rejected with non-error" warning.
    // Setting this to pre-computed string to satisfy the check.
    super(getErrorMessage(httpResponse, body));
    // Details: https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, FetchError.prototype);
    this.stack = httpResponse.stack || (body && body.stack);
  }

  /**
   * Returns the message associated with the Error.
   */
  get message(): string {
    // Standard message computed in the contructor should be probably good enough. But this is
    // a legacy code and it's not clear how exactly is it used.
    return getErrorMessage(this.httpResponse, this.body);
  }

  /**
   * Returns the error status.
   */
  get status(): number {
    return this.httpResponse.status;
  }

  /**
   * Returns the status text for the error.
   */
  get statusText(): string {
    return this.httpResponse.statusText;
  }

  /**
   * Returns the custom code for the error.
   */
  get code(): string | undefined {
    if (this.body && this.body.error && this.body.error.code) {
      return this.body.error.code;
    } else {
      return undefined;
    }
  }

  /**
   * Needs to be here so that this guy plays well with AI.
   * AI throws error as it doesn't allow tracking custom objects as errors,
   * the stacktrack tracked for each of our errors is garbled.
   */
  get toJs(): Error {
    const error = new Error(this.message);
    error.stack = this.stack;
    error.name = this.name;
    return error;
  }
}
