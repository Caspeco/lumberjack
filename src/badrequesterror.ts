export default class BadRequestError extends Error {
  public response: Response;
  constructor(response: Response) {
    super();
    Object.setPrototypeOf(this, BadRequestError.prototype);
    this.response = response;
  }
}
