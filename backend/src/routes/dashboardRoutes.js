import { Router } from "express";
import { analytics } from "../controllers/dashboardController.js";
import { authenticate } from "../middleware/auth.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/analytics", authenticate, analytics);
