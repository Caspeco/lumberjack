export default class BadRequestError extends Error {
  public response: any;
  public badRequest: boolean;
  constructor(response: any) {
    super();
    this.badRequest = true;
    Object.setPrototypeOf(this, BadRequestError.prototype);
    
    this.response = response;
  }
}
