export function notFound(req, res) {
  res.status(404).json({ error: { message: "The requested endpoint was not found." } });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === "entity.parse.failed") return res.status(400).json({ error: { message: "Request body must contain valid JSON." } });
  if (error.type === "entity.too.large") return res.status(413).json({ error: { message: "Request body is too large." } });
  if (error.name === "ValidationError" || error.name === "ZodError") {
    const details = error.issues?.map((issue) => ({ field: issue.path.join("."), message: issue.message }));
    return res.status(400).json({ error: { message: "Please check the submitted information.", ...(details ? { details } : {}) } });
  }
  if (error.name === "CastError") return res.status(400).json({ error: { message: "The supplied identifier is invalid." } });
  if (error.code === 11000) return res.status(409).json({ error: { message: "This record already exists." } });
  if (process.env.NODE_ENV !== "production") console.error(error);
  return res.status(500).json({ error: { message: "An unexpected server error occurred." } });
}
