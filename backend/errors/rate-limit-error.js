import { CustomError } from './custom-error.js';

export class RateLimitError extends CustomError {
  statusCode = 429; // Too Many Requests
  
  /**
   * @param {string} message - Error message
   * @param {Object} [details] - Additional error details
   */
  constructor(message, details = {}) {
    super(message || 'Too many requests, please try again later.');
    this.details = details;
    
    // Only because we're extending a built-in class
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
  
  serializeErrors() {
    return [{
      message: this.message,
      ...this.details,
      code: 'RATE_LIMIT_EXCEEDED'
    }];
  }
}
