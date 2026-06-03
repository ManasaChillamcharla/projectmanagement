import { fail } from "../utils/http.js";

export function notFound(req, res) {
  return fail(res, `Route not found: ${req.originalUrl}`, 404);
}

export function errorHandler(error, _req, res, _next) {
  console.error(error);
  return fail(res, error.message || "Internal server error", error.status || 500);
}
