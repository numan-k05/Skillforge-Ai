/**
 * Wraps an async route/controller handler so any rejected promise is
 * forwarded to Express's error-handling middleware instead of crashing
 * the process or hanging the request.
 */
export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default asyncHandler;
