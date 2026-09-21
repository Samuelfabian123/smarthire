const jwt = require("jsonwebtoken");

/**
 * Verifies the JWT sent in the Authorization header (format: "Bearer <token>").
 * Attaches the decoded user payload ({ id, role }) to req.user if valid.
 */
function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Restricts a route to specific roles, e.g. requireRole("employer").
 * Use after protect().
 */
function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Access restricted to ${role}s` });
    }
    next();
  };
}

module.exports = { protect, requireRole };
