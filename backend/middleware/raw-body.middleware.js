/**
 * Raw Body Middleware
 * 
 * This middleware captures and stores the raw request body as a Buffer
 * and makes it available as req.rawBody. This is necessary for webhook
 * endpoints that need to verify the request signature using the raw body.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export const rawBodyMiddleware = (req, res, next) => {
  // Only process requests with a body
  if (!req.body || !Object.keys(req.body).length) {
    return next();
  }

  // Store the raw body as a Buffer
  req.rawBody = Buffer.from(JSON.stringify(req.body));
  next();
};

export default rawBodyMiddleware;
