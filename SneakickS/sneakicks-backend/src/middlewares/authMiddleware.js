import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "sneakicks-dev-secret-change-me";

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "Missing or invalid Authorization header (expected: Bearer <token>)",
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role, username: payload.username };
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/**
 * optionalAuth — gan req.user neu co Bearer token hop le, khong bao loi neu khong co.
 * Dung cho API phuc vu ca khach (guest) lan user, vi du ghi nhan hanh vi.
 */
export const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme === "Bearer" && token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = { id: payload.sub, role: payload.role, username: payload.username };
    } catch {
      req.user = null;
    }
  }
  return next();
};

/** Admin chi van hanh he thong (xac thuc hang), khong tham gia mua/ban. */
export const forbidAdmin = (req, res, next) => {
  if (req.user?.role === "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin accounts cannot place orders",
    });
  }
  return next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin role required",
    });
  }
  return next();
};
