import { ApiError } from "./errorHandler.js";

/**
 * Express middleware factory: validates `req.body` against a zod schema.
 * On success, the parsed/coerced data is attached to `req.validated`.
 * On failure, forwards a 400 ApiError with per-field messages — never
 * exposes zod's internal error shape directly.
 */
export function validate(schema) {
  return function validateMiddleware(req, res, next) {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "form",
        message: issue.message,
      }));
      return next(new ApiError(400, "Validation failed", details));
    }

    req.validated = result.data;
    next();
  };
}

/** Validates route parameters using the same safe response shape as body validation. */
export function validateParams(schema) {
  return function validateParamsMiddleware(req, res, next) {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "parameter",
        message: issue.message,
      }));
      return next(new ApiError(400, "Validation failed", details));
    }
    req.params = result.data;
    next();
  };
}

/** Validates query parameters without changing the existing body-validation contract. */
export function validateQuery(schema) {
  return function validateQueryMiddleware(req, res, next) {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "query",
        message: issue.message,
      }));
      return next(new ApiError(400, "Validation failed", details));
    }
    req.validatedQuery = result.data;
    next();
  };
}

export default validate;
