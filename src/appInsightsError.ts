export default class AppInsightsError extends Error {
  public error: any;
  public appInsightsError: boolean;
  constructor(error: any) {
    super();
    this.appInsightsError = true;
    Object.setPrototypeOf(this, AppInsightsError.prototype);
    
    this.error = error;
  }
}
