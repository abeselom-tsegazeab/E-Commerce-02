import { CustomError } from './custom-error.js';

export class RequestValidationError extends CustomError {
  statusCode = 400;
  
  constructor(errors) {
    super('Invalid request parameters');
    this.errors = errors;
    
    // Only because we're extending a built-in class
    Object.setPrototypeOf(this, RequestValidationError.prototype);
  }
  
  serializeErrors() {
    return this.errors.map(err => ({
      message: err.msg,
      field: err.param,
      value: err.value,
      location: err.location
    }));
  }
}
