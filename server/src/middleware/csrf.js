import { randomBytes, timingSafeEqual } from "node:crypto";

export function issueCsrfToken(req, res) {
  const token = randomBytes(32).toString("hex");
  res.cookie("campuscart_csrf", token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
  res.json({ data: { token } });
}

export function verifyCsrf(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const cookieToken = req.cookies?.campuscart_csrf;
  const headerToken = req.get("X-CSRF-Token");
  if (!cookieToken || !headerToken || cookieToken.length !== headerToken.length) {
    return res.status(403).json({ error: { message: "A valid CSRF token is required. Refresh the page and try again." } });
  }
  const expected = Buffer.from(cookieToken);
  const actual = Buffer.from(headerToken);
  if (!timingSafeEqual(expected, actual)) {
    return res.status(403).json({ error: { message: "A valid CSRF token is required. Refresh the page and try again." } });
  }
  next();
}
