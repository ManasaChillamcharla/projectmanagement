import { AgentExecution } from "../models/AgentExecution.js";
import { Project } from "../models/Project.js";
import { Report } from "../models/Report.js";
import { retrieveTemplates } from "./chromaService.js";
import { fallbackOutput, generateWorkflowOutputs } from "./langchainService.js";
import { notifyProjectPlanningWebhook } from "./n8nService.js";

export const agents = [
  {
    name: "Requirement Analyzer",
    responsibility: "Extract features, functional requirements, non-functional requirements, ambiguities, assumptions, and scope.",
    output: ["Features", "Requirements", "Assumptions", "Scope", "Ambiguities"]
  },
  {
    name: "PRD Generator",
    responsibility: "Generate a product requirement document, user stories, and acceptance criteria.",
    output: ["PRD", "User Stories", "Acceptance Criteria"]
  },
  {
    name: "Architecture Agent",
    responsibility: "Generate frontend architecture, backend architecture, MongoDB collections, API endpoints, and folder structure.",
    output: ["Architecture", "Database Design", "API Design", "Folder Structure"]
  },
  {
    name: "Sprint Planner",
    responsibility: "Generate sprint plan, tasks, story points, and timelines.",
    output: ["Sprint Breakdown", "Tasks", "Story Points", "Timeline"]
  },
  {
    name: "Risk Analyzer",
    responsibility: "Detect risks, gaps, delays, and mitigation plans.",
    output: ["Risk List", "Severity Levels", "Recommendations"]
  },
  {
    name: "Status Reporter",
    responsibility: "Generate weekly report, stakeholder update, and project health score.",
    output: ["Weekly Report", "Stakeholder Summary", "Health Score"]
  },
  {
    name: "Automation Strategy Agent",
    responsibility: "Suggest workflow, reporting, and notification automations.",
    output: ["Automation Recommendations", "Automation Blueprint"]
  }
];

export async function executeProjectAgents(projectId, options = {}) {
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  await Project.findByIdAndUpdate(projectId, { status: "Planning" });
  await AgentExecution.deleteMany({ projectId });
  if (options.notifyWebhook !== false) {
    await notifyProjectPlanningWebhook(project);
  }

  const templates = await retrieveTemplates(project.requirement);
  const workflowStarted = Date.now();
  let generatedOutputs;

  try {
    generatedOutputs = await generateWorkflowOutputs({ agents, project, templates });
  } catch (error) {
    console.warn("Agent workflow generation recovered with fallback outputs:", error.message);
    generatedOutputs = Object.fromEntries(
      agents.map((agent) => [agent.name, fallbackOutput(agent, project, `Agent recovered from an internal error: ${error.message}`)])
    );
  }

  for (const agent of agents) {
    const execution = await AgentExecution.create({
      projectId,
      agentName: agent.name,
      status: "running"
    });

    const started = Date.now();
    try {
      const output = generatedOutputs[agent.name] || fallbackOutput(agent, project, "Workflow response did not include this agent.");
      execution.output = output;
      execution.executionTime = Math.max(Date.now() - started, Date.now() - workflowStarted);
      execution.status = "completed";
      await execution.save();
    } catch (error) {
      execution.executionTime = Date.now() - started;
      execution.output = fallbackOutput(agent, project, `Agent recovered from an internal error: ${error.message}`);
      execution.status = "completed";
      execution.error = error.message;
      await execution.save();
    }
  }

  await Project.findByIdAndUpdate(projectId, { status: "Active" });
  await createReportsFromExecutions(projectId);
}

export async function createReportsFromExecutions(projectId) {
  const executions = await AgentExecution.find({ projectId }).sort("createdAt");
  const content = executions.reduce((acc, item) => {
    acc[item.agentName] = item.output;
    return acc;
  }, {});

  await Report.deleteMany({ projectId });
  await Report.insertMany([
    { projectId, reportType: "Project Planning Pack", content },
    { projectId, reportType: "Weekly Stakeholder Report", content: content["Status Reporter"] || content }
  ]);
}
