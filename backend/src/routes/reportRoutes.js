import { Router } from "express";
import {
  createReport,
  exportDocx,
  exportPdf,
  exportSprintXlsx,
  listReports
} from "../controllers/reportController.js";
import { audit } from "../middleware/audit.js";
import { authenticate } from "../middleware/auth.js";

export const reportRoutes = Router();

reportRoutes.use(authenticate);
reportRoutes.get("/projects/:id/reports", listReports);
reportRoutes.post("/projects/:id/reports", audit("create", "Report"), createReport);
reportRoutes.get("/projects/:id/export/pdf", exportPdf);
reportRoutes.get("/projects/:id/export/docx", exportDocx);
reportRoutes.get("/projects/:id/export/sprint-xlsx", exportSprintXlsx);
