import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { fail } from "../utils/http.js";

export async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return fail(res, "Authentication token is required", 401);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return fail(res, "User no longer exists", 401);
    req.user = user;
    next();
  } catch {
    return fail(res, "Invalid or expired token", 401);
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return fail(res, "Insufficient permissions", 403);
    }
    next();
  };
}
