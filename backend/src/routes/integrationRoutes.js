import { Router } from "express";
import { createN8nProject, getN8nExecutions, getN8nStatus, saveN8nExecutions } from "../controllers/integrationController.js";
import { authenticate } from "../middleware/auth.js";

export const integrationRoutes = Router();

integrationRoutes.get("/n8n/status", authenticate, getN8nStatus);
integrationRoutes.post("/n8n/projects", createN8nProject);
integrationRoutes.get("/n8n/projects/:id/executions", getN8nExecutions);
integrationRoutes.post("/n8n/projects/:id/executions", saveN8nExecutions);
