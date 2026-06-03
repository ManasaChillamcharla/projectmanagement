import { AgentExecution } from "../models/AgentExecution.js";
import { Project } from "../models/Project.js";
import { Report } from "../models/Report.js";
import { ok } from "../utils/http.js";

export async function analytics(req, res) {
  const projectFilter = req.user.role === "Admin" ? {} : { owner: req.user._id };
  const projects = await Project.find(projectFilter);
  const projectIds = projects.map((project) => project._id);
  const executions = await AgentExecution.find({ projectId: { $in: projectIds } });
  const reports = await Report.find({ projectId: { $in: projectIds } });

  const riskExecutions = executions.filter((execution) => execution.agentName === "Risk Analyzer");
  const failedCount = executions.filter((execution) => execution.status === "failed").length;
  const riskScore = Math.min(100, Math.round((failedCount / Math.max(executions.length, 1)) * 100 + riskExecutions.length * 3));

  return ok(res, {
    totalProjects: projects.length,
    activeProjects: projects.filter((project) => project.status === "Active").length,
    completedProjects: projects.filter((project) => project.status === "Completed").length,
    riskScore,
    generatedReports: reports.length,
    statusDistribution: projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {}),
    sprintProgress: [
      { name: "Discovery", value: 72 },
      { name: "Build", value: 48 },
      { name: "Validation", value: 26 }
    ],
    riskDistribution: [
      { name: "Low", value: Math.max(1, projects.length - failedCount) },
      { name: "Medium", value: riskExecutions.length },
      { name: "High", value: failedCount }
    ]
  });
}
