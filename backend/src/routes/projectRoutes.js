import { Router } from "express";
import {
  createProject,
  deleteProject,
  executeProject,
  getProject,
  listExecutions,
  listProjects,
  updateProject
} from "../controllers/projectController.js";
import { audit } from "../middleware/audit.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createProjectSchema, updateProjectSchema } from "../validators/projectSchemas.js";

export const projectRoutes = Router();

projectRoutes.use(authenticate);
projectRoutes.get("/", listProjects);
projectRoutes.post("/", validate(createProjectSchema), audit("create", "Project"), createProject);
projectRoutes.get("/:id", getProject);
projectRoutes.patch("/:id", validate(updateProjectSchema), audit("update", "Project"), updateProject);
projectRoutes.delete("/:id", audit("delete", "Project"), deleteProject);
projectRoutes.post("/:id/execute", audit("execute", "AgentWorkflow"), executeProject);
projectRoutes.get("/:id/executions", listExecutions);
