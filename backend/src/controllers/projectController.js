import { Project } from "../models/Project.js";
import { AgentExecution } from "../models/AgentExecution.js";
import { AuditLog } from "../models/AuditLog.js";
import { Report } from "../models/Report.js";
import { ok, fail } from "../utils/http.js";
import { notifyProjectPlanningWebhook } from "../services/n8nService.js";
import { queueN8nExecutions, saveN8nWorkflowResult } from "../services/n8nResultService.js";

function ownerFilter(req) {
  return req.user.role === "Admin" ? {} : { owner: req.user._id };
}

export async function listProjects(req, res) {
  const projects = await Project.find(ownerFilter(req)).sort("-createdAt");
  return ok(res, projects);
}

export async function createProject(req, res) {
  const project = await Project.create({ ...req.validated.body, owner: req.user._id });
  return ok(res, project, 201);
}

export async function getProject(req, res) {
  const project = await Project.findOne({ _id: req.params.id, ...ownerFilter(req) });
  if (!project) return fail(res, "Project not found", 404);
  return ok(res, project);
}

export async function updateProject(req, res) {
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, ...ownerFilter(req) },
    req.validated.body,
    { new: true }
  );
  if (!project) return fail(res, "Project not found", 404);
  return ok(res, project);
}

export async function deleteProject(req, res) {
  const project = await Project.findOneAndDelete({ _id: req.params.id, ...ownerFilter(req) });
  if (!project) return fail(res, "Project not found", 404);
  await Promise.all([
    AgentExecution.deleteMany({ projectId: project._id }),
    Report.deleteMany({ projectId: project._id }),
    AuditLog.deleteMany({ "metadata.params.id": project._id.toString() })
  ]);
  return ok(res, { id: project._id });
}

export async function executeProject(req, res) {
  const project = await Project.findOne({ _id: req.params.id, ...ownerFilter(req) });
  if (!project) return fail(res, "Project not found", 404);

  await queueN8nExecutions(project._id);

  let webhook;
  try {
    webhook = await notifyProjectPlanningWebhook(project);
  } catch (error) {
    await Project.findByIdAndUpdate(project._id, { status: "Draft" });
    return fail(res, `n8n webhook failed: ${error.message}`, 502);
  }

  const savedResult = await saveN8nWorkflowResult(project._id, webhook?.body);
  return ok(
    res,
    {
      message: savedResult.saved
        ? "n8n workflow completed and returned agent output"
        : "n8n workflow triggered. Waiting for n8n to send agent output.",
      webhook: webhook || { status: "not_configured" },
      n8nResult: savedResult
    },
    202
  );
}

export async function listExecutions(req, res) {
  const project = await Project.findOne({ _id: req.params.id, ...ownerFilter(req) });
  if (!project) return fail(res, "Project not found", 404);
  const executions = await AgentExecution.find({ projectId: req.params.id }).sort("createdAt");
  return ok(res, executions);
}
