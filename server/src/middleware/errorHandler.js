/**
 * 404 Not Found Middleware.
 */
export function notFound(req, res) {
  res.status(404).json({
    error: {
      message: `The requested endpoint '${req.method} ${req.originalUrl}' was not found.`
    }
  });
}

/**
 * Centralized Error Handler Middleware.
 * Strictly guarantees `{ error: { message, details? } }` structure.
 */
export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  // Handle malformed JSON request bodies
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      error: { message: "Request body must contain valid JSON." }
    });
  }

  // Handle payload too large
  if (error.type === "entity.too.large") {
    return res.status(413).json({
      error: { message: "Request payload is too large. Limit is 32KB." }
    });
  }

  // Handle Zod validation errors
  if (error.name === "ZodError" && error.issues) {
    const details = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message
    }));
    return res.status(400).json({
      error: {
        message: "Please check the submitted information.",
        details
      }
    });
  }

  // Handle Mongoose schema validation errors
  if (error.name === "ValidationError" && error.errors) {
    const details = Object.entries(error.errors).map(([field, err]) => ({
      field,
      message: err.message
    }));
    return res.status(400).json({
      error: {
        message: "Validation failed for one or more fields.",
        details
      }
    });
  }

  // Handle Invalid Mongoose ObjectId format
  if (error.name === "CastError") {
    return res.status(400).json({
      error: { message: `Invalid identifier provided for ${error.path || "resource"}.` }
    });
  }

  // Handle MongoDB Duplicate Key (E11000)
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "record";
    return res.status(409).json({
      error: { message: `A record with this ${field} already exists.` }
    });
  }

  // Log unexpected errors during non-production
  if (process.env.NODE_ENV !== "production") {
    console.error("Unhandled Server Error:", error);
  }

  return res.status(500).json({
    error: { message: "An unexpected server error occurred. Please try again later." }
  });
}
