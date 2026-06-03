import { z } from "zod";
import { env } from "../config/env.js";
import { AgentExecution } from "../models/AgentExecution.js";
import { Project } from "../models/Project.js";
import { User } from "../models/User.js";
import { executeProjectAgents } from "../services/agentService.js";
import { saveN8nWorkflowResult } from "../services/n8nResultService.js";
import { fail, ok } from "../utils/http.js";

const n8nProjectSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().default("Created from n8n workflow"),
  requirement: z.string().min(10),
  ownerEmail: z.string().email().optional()
});

function validN8nSecret(req) {
  if (!env.N8N_WEBHOOK_SECRET || env.N8N_WEBHOOK_SECRET.startsWith("replace-with")) return true;
  return req.headers["x-n8n-secret"] === env.N8N_WEBHOOK_SECRET;
}

function webhookSummary() {
  if (!env.N8N_PROJECT_PLANNING_WEBHOOK_URL) {
    return {
      configured: false,
      status: "not_configured",
      message: "N8N_PROJECT_PLANNING_WEBHOOK_URL is not set."
    };
  }

  const url = new URL(env.N8N_PROJECT_PLANNING_WEBHOOK_URL);
  const testMode = url.pathname.includes("/webhook-test/");
  const fallbackPath = testMode ? url.pathname.replace("/webhook-test/", "/webhook/") : url.pathname.replace("/webhook/", "/webhook-test/");

  return {
    configured: true,
    status: testMode ? "test_webhook_configured" : "production_webhook_configured",
    host: url.host,
    path: url.pathname,
    fallbackPath,
    testMode,
    message: testMode
      ? "Test webhook is configured. The backend will also try the production webhook fallback automatically."
      : "Production webhook URL is configured. The backend can also try the test webhook fallback."
  };
}

export async function getN8nStatus(_req, res) {
  return ok(res, webhookSummary());
}

async function getAutomationOwner(email) {
  const ownerEmail = email || "n8n-automation@project-copilot.local";
  let user = await User.findOne({ email: ownerEmail });

  if (!user) {
    user = await User.create({
      name: email ? "n8n Project Owner" : "n8n Automation",
      email: ownerEmail,
      password: `N8n-${Date.now()}-Automation`,
      role: "Admin"
    });
  }

  return user;
}

export async function createN8nProject(req, res) {
  if (!validN8nSecret(req)) return fail(res, "Invalid n8n shared secret", 401);

  const parsed = n8nProjectSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, "Validation failed", 422, parsed.error.flatten());

  const owner = await getAutomationOwner(parsed.data.ownerEmail);
  const project = await Project.create({
    title: parsed.data.title,
    description: parsed.data.description,
    requirement: parsed.data.requirement,
    owner: owner._id
  });

  executeProjectAgents(project._id, { notifyWebhook: false }).catch((error) => console.error("n8n-triggered workflow failed:", error));

  return ok(
    res,
    {
      projectId: project._id,
      status: "workflow_started",
      projectUrl: `${env.FRONTEND_URL}/projects/${project._id}/agents`,
      executionsUrl: `${env.BACKEND_URL}/api/integrations/n8n/projects/${project._id}/executions`
    },
    202
  );
}

export async function getN8nExecutions(req, res) {
  if (!validN8nSecret(req)) return fail(res, "Invalid n8n shared secret", 401);
  const executions = await AgentExecution.find({ projectId: req.params.id }).sort("createdAt");
  return ok(res, executions);
}

export async function saveN8nExecutions(req, res) {
  if (!validN8nSecret(req)) return fail(res, "Invalid n8n shared secret", 401);

  const project = await Project.findById(req.params.id);
  if (!project) return fail(res, "Project not found", 404);

  const saved = await saveN8nWorkflowResult(project._id, req.body);
  if (!saved.saved) {
    return fail(
      res,
      "No agent outputs found. Send { executions: [{ agentName, output }] } or { outputs: { \"Requirement Analyzer\": {...} } }.",
      422
    );
  }

  return ok(res, {
    projectId: project._id,
    status: "saved",
    savedCount: saved.count
  });
}
