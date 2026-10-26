export function authorizeAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: { message: "Administrator access is required." } });
  }
  next();
}
