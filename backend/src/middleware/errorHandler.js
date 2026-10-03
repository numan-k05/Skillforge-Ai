
export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      message: "Route not found.",
    },
  });
}

// Maps known PostgreSQL / connection error codes to a safe, user-facing
// status + message, without ever forwarding raw driver/database errors
// to the client.
function mapKnownDatabaseError(err) {
  if (err.code === "23505") {
    // unique_violation — most commonly a duplicate email on signup.
    return new ApiError(409, "That value is already in use.");
  }
  if (err.code === "3D000") {
    return new ApiError(503, "The service is temporarily unavailable. Please try again later.");
  }
  if (err.code === "42P01") {
    return new ApiError(503, "The service is temporarily unavailable. Please try again later.");
  }
  if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" || err.code === "28P01" || err.code === "ETIMEDOUT" || err.code === "ECONNRESET" || err.code === "57P01" || err.code === "53300") {
    return new ApiError(503, "The service is temporarily unavailable. Please try again later.");
  }
  return null;
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const mapped = err instanceof ApiError ? null : mapKnownDatabaseError(err);
  const parserErrors = {
    "entity.parse.failed": [400, "Request body must contain valid JSON."],
    "entity.too.large": [413, "Request body is too large."],
    "parameters.too.many": [413, "Too many form parameters."],
    "encoding.unsupported": [415, "Unsupported request encoding."],
    "charset.unsupported": [415, "Unsupported request charset."],
  };
  const parserError = parserErrors[err.type];
  const effectiveErr = mapped || (parserError ? new ApiError(...parserError) : err);
  const trusted = effectiveErr instanceof ApiError;
  const statusCode = trusted ? effectiveErr.statusCode : 500;
  const payload = {
    error: {
      message: trusted ? effectiveErr.message : "Internal server error. Please try again later.",
      ...(trusted && effectiveErr.details ? { details: effectiveErr.details } : {}),
    },
  };

  if (statusCode === 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(statusCode).json(payload);
}
