import { AgentExecution } from "../models/AgentExecution.js";
import { Project } from "../models/Project.js";
import { agents, createReportsFromExecutions } from "./agentService.js";
import { retrieveTemplates } from "./chromaService.js";
import { fallbackOutput, generateWorkflowOutputs } from "./langchainService.js";

function unwrapPayload(payload) {
  if (Array.isArray(payload)) {
    if (payload.length === 1) return unwrapPayload(payload[0]);
    return payload;
  }
  if (!payload || typeof payload !== "object") return payload;
  if (payload.json) return unwrapPayload(payload.json);
  if (payload.data) return unwrapPayload(payload.data);
  if (payload.body) return unwrapPayload(payload.body);
  if (payload.result) return unwrapPayload(payload.result);
  if (payload.response) return unwrapPayload(payload.response);
  return payload;
}

function parseOutput(output) {
  if (typeof output !== "string") return output;

  const trimmed = output.trim();
  if (!trimmed) return output;

  try {
    return JSON.parse(trimmed);
  } catch {
    return output;
  }
}

function outputMapFromPayload(payload) {
  const body = unwrapPayload(payload);
  if (!body || typeof body !== "object") return {};

  if (Array.isArray(body)) {
    return Object.fromEntries(
      body
        .map((item) => unwrapPayload(item))
        .map((item) => [item?.agentName || item?.name || item?.agent, parseOutput(item?.output ?? item?.result ?? item?.response ?? item)])
        .filter(([name]) => Boolean(name))
    );
  }

  if (Array.isArray(body.executions)) {
    return Object.fromEntries(
      body.executions
        .map((item) => unwrapPayload(item))
        .map((item) => [item.agentName || item.name, parseOutput(item.output ?? item.result ?? item.response ?? item)])
        .filter(([name]) => Boolean(name))
    );
  }

  if (body.outputs && typeof body.outputs === "object") return body.outputs;
  if (body.agents && typeof body.agents === "object") return body.agents;

  const aliasMap = {
    featuresScope: "Requirement Analyzer",
    featuresAndScope: "Requirement Analyzer",
    requirements: "Requirement Analyzer",
    requirementAnalysis: "Requirement Analyzer",
    prd: "PRD Generator",
    prdDocument: "PRD Generator",
    architecture: "Architecture Agent",
    sprintPlan: "Sprint Planner",
    riskAnalysis: "Risk Analyzer",
    statusReport: "Status Reporter",
    automationPlan: "Automation Strategy Agent"
  };

  const aliasedOutputs = Object.entries(aliasMap).reduce((acc, [key, agentName]) => {
    if (body[key] !== undefined && body[key] !== null) {
      acc[agentName] = parseOutput(body[key]);
    }
    return acc;
  }, {});

  if (Object.keys(aliasedOutputs).length) return aliasedOutputs;

  const knownAgentNames = new Set(agents.map((agent) => agent.name));
  return Object.fromEntries(
    Object.entries(body)
      .filter(([key]) => knownAgentNames.has(key))
      .map(([key, value]) => [key, parseOutput(value)])
  );
}

async function fillMissingOutputs(project, outputs) {
  const missingAgents = agents.filter((agent) => outputs[agent.name] === undefined || outputs[agent.name] === null);
  if (!missingAgents.length) return outputs;

  try {
    const templates = await retrieveTemplates(project.requirement);
    const generatedOutputs = await generateWorkflowOutputs({ agents: missingAgents, project, templates });
    return {
      ...Object.fromEntries(missingAgents.map((agent) => [agent.name, generatedOutputs[agent.name] || fallbackOutput(agent, project, "n8n did not return this agent output.")])),
      ...outputs
    };
  } catch (error) {
    return {
      ...Object.fromEntries(missingAgents.map((agent) => [agent.name, fallbackOutput(agent, project, `n8n did not return this agent output, and recovery generation failed: ${error.message}`)])),
      ...outputs
    };
  }
}

export async function queueN8nExecutions(projectId) {
  await Project.findByIdAndUpdate(projectId, { status: "Planning" });
  await AgentExecution.deleteMany({ projectId });
  await AgentExecution.insertMany(
    agents.map((agent) => ({
      projectId,
      agentName: agent.name,
      status: "queued",
      output: null,
      executionTime: 0
    }))
  );
}

export async function saveN8nWorkflowResult(projectId, payload) {
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  const outputs = await fillMissingOutputs(project, outputMapFromPayload(payload));
  const entries = Object.entries(outputs).filter(([, output]) => output !== undefined && output !== null);
  if (!entries.length) return { saved: false, count: 0 };

  const started = Date.now();
  for (const agent of agents) {
    const output = outputs[agent.name];
    await AgentExecution.findOneAndUpdate(
      { projectId, agentName: agent.name },
      {
        projectId,
        agentName: agent.name,
        status: output === undefined || output === null ? "queued" : "completed",
        output: output ?? null,
        executionTime: output === undefined || output === null ? 0 : Date.now() - started,
        error: ""
      },
      { new: true, upsert: true }
    );
  }

  await Project.findByIdAndUpdate(projectId, { status: "Active" });
  await createReportsFromExecutions(projectId);
  return { saved: true, count: entries.length };
}
