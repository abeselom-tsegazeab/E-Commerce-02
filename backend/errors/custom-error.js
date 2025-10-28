/**
 * Base class for custom errors in the application
 * All custom errors should extend this class
 */
export class CustomError extends Error {
  /**
   * @param {string} message - Error message
   */
  constructor(message) {
    super(message);
    
    // Only because we're extending a built-in class
    Object.setPrototypeOf(this, CustomError.prototype);
  }
  
  /**
   * Method to serialize error messages when sending error responses
   * Must be implemented by child classes
   * @returns {Array} Array of error message objects
   */
  serializeErrors() {
    return [
      {
        message: this.message
      }
    ];
  }
}
