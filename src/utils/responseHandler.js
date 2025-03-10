class ResponseHandler {
  /**
   * Sends a JSON response.
   * @param {Object} res - Express response object.
   * @param {Number} statusCode - HTTP status code.
   * @param {Boolean} success - Indicates success or failure.
   * @param {String} message - Response message.
   * @param {Object} data - Response data (default: null).
   * @param {Object} metadata - Additional metadata (timestamp, IP, etc.).
   */
  static sendResponse(res, statusCode, success, message, data = null, metadata = {}) {
    const response = { success, message };

    if (data !== null) response.data = data;
    if (metadata !== null && Object.keys(metadata).length > 0) response.metadata = metadata;

    return res.status(statusCode).json(response);
  }

  /**
   * Sends a success response.
   * @param {Object} res - Express response object.
   * @param {Number} statusCode - HTTP status code (default: 200).
   * @param {String} message - Success message.
   * @param {Object} data - Response data (optional).
   * @param {Object} req - Request object for metadata (IP, User-Agent) (optional).
   */
  static success(res, statusCode = 200, message = "Success", data = null, metadata = {}) {
  

    return this.sendResponse(res, statusCode, true, message, data, metadata);
  }

  /**
   * Sends an error response.
   * @param {Object} res - Express response object.
   * @param {Number} statusCode - HTTP status code (default: 500).
   * @param {String} message - Error message.
   * @param {Object|String} error - Error details (optional).
   * @param {Object} req - Request object for metadata (optional).
   */
  static error(res, statusCode = 500, message = "Something went wrong", error = null, metadata = {}) {
    return this.sendResponse(res, statusCode, false, message, error, metadata);
  }
}

export default ResponseHandler;
