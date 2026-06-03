import { AuditLog } from "../models/AuditLog.js";

export function audit(action, entity) {
  return async (req, _res, next) => {
    try {
      await AuditLog.create({
        actor: req.user?._id,
        action,
        entity,
        metadata: { params: req.params, method: req.method, path: req.originalUrl }
      });
    } catch (error) {
      console.warn("Audit log skipped:", error.message);
    }
    next();
  };
}
