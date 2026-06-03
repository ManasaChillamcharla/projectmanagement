import { Report } from "../models/Report.js";
import { Project } from "../models/Project.js";
import { ok, fail } from "../utils/http.js";
import { streamDocx, streamPdf, streamSprintXlsx } from "../services/exportService.js";

function ownerFilter(req) {
  return req.user.role === "Admin" ? {} : { owner: req.user._id };
}

async function assertProject(req, res) {
  const project = await Project.findOne({ _id: req.params.id, ...ownerFilter(req) });
  if (!project) fail(res, "Project not found", 404);
  return project;
}

export async function listReports(req, res) {
  if (!(await assertProject(req, res))) return;
  const reports = await Report.find({ projectId: req.params.id }).sort("-createdAt");
  return ok(res, reports);
}

export async function createReport(req, res) {
  if (!(await assertProject(req, res))) return;
  const report = await Report.create({ projectId: req.params.id, ...req.body });
  return ok(res, report, 201);
}

export async function exportPdf(req, res) {
  if (!(await assertProject(req, res))) return;
  return streamPdf(req.params.id, res);
}

export async function exportDocx(req, res) {
  if (!(await assertProject(req, res))) return;
  return streamDocx(req.params.id, res);
}

export async function exportSprintXlsx(req, res) {
  if (!(await assertProject(req, res))) return;
  return streamSprintXlsx(req.params.id, res);
}
