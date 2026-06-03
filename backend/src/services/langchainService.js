import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { env } from "../config/env.js";

function getModel() {
  return new ChatGroq({
    apiKey: env.GROQ_API_KEY,
    model: env.GROQ_MODEL,
    temperature: 0.2,
    maxTokens: 2200
  });
}

export function fallbackOutput(agent, project, reason = "Groq generation was unavailable, so deterministic planning output was generated.") {
  const requirement = project.requirement;
  const outputs = {
    "Requirement Analyzer": [
      "Features: User accounts, project workspace, planning automation, reports, and exports.",
      "Functional requirements: users can submit software requirements, the workflow runs planning agents, and users can review generated artifacts.",
      "Non-functional requirements: secure authentication, responsive dashboard, and auditable workflow execution.",
      "Assumptions: the MVP targets web users and external AI/vector services may be unavailable during local development.",
      `Scope: Planning workflow for ${requirement}.`,
      "Ambiguities: exact integrations, delivery timeline, and stakeholder approval rules need confirmation."
    ],
    "PRD Generator": [
      `Objective: Deliver ${project.title} from the submitted requirements.`,
      "Primary users: product owner, project manager, and engineering lead.",
      "User stories: create projects from requirements, inspect agent outputs, and export reports for review.",
      "Acceptance criteria: project is created, all seven agents complete, and reports are generated."
    ],
    "Architecture Agent": [
      "Frontend architecture: Next.js App Router with protected SaaS routes, project dashboards, agent execution polling, and export controls.",
      "Backend architecture: Express REST API with MongoDB persistence, authentication middleware, workflow orchestration, LangChain/Groq generation, Chroma retrieval, and n8n webhook integration.",
      "MongoDB collections: users, projects, agentexecutions, reports, and auditlogs.",
      "API endpoints: /api/projects, /api/projects/:id, /api/projects/:id/execute, /api/projects/:id/executions, and export endpoints for PDF, DOCX, and sprint XLSX.",
      "Folder structure: frontend/src/app, frontend/src/components, frontend/src/lib, backend/src/controllers, backend/src/routes, backend/src/services, backend/src/models, and backend/src/middleware."
    ],
    "Sprint Planner": [
      "Sprint 1: discovery, authentication, and project setup.",
      "Sprint 2: project workflow, agent execution records, and dashboard views.",
      "Sprint 3: reports, exports, integrations, and smoke-test hardening.",
      "Estimated effort: 34 story points across three sprints."
    ],
    "Risk Analyzer": [
      "High risk: ambiguous requirements may produce weak plans. Mitigation: surface assumptions and confirm open questions.",
      "Medium risk: AI provider rate limits or outages. Mitigation: compact prompts and deterministic fallback outputs.",
      "Medium risk: integration drift between n8n, backend, and frontend. Mitigation: run workflow smoke tests before demos."
    ],
    "Status Reporter": [
      `${project.title} planning workflow completed with generated planning artifacts.`,
      "Stakeholder summary: requirements, PRD, architecture, sprint plan, risks, and automation strategy are available.",
      "Health score: 82/100."
    ],
    "Automation Strategy Agent": [
      "Recommended automations: trigger project planning from n8n, notify stakeholders when the workflow completes, and export sprint reports automatically.",
      "Blueprint: n8n HTTP Request -> backend execute endpoint -> poll executions endpoint -> send report/export links."
    ]
  };

  const body = outputs[agent.name] || [`${agent.name} generated a planning artifact for: ${requirement}`];
  return [`Note: ${reason}`, ...body].join("\n\n");
}

function truncateText(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function compactTemplates(templates) {
  return (templates || [])
    .slice(0, 2)
    .map((template, index) => `Template ${index + 1}: ${truncateText(template, 450)}`)
    .join("\n");
}

function parseWorkflowSections(text, agents) {
  const sections = {};
  let currentAgent = null;
  let currentLines = [];

  const flush = () => {
    if (currentAgent) {
      sections[currentAgent] = currentLines.join("\n").trim();
    }
  };

  text.split(/\r?\n/).forEach((line) => {
    const heading = agents.find((agent) => line.trim().toLowerCase() === `## ${agent.name}`.toLowerCase());
    if (heading) {
      flush();
      currentAgent = heading.name;
      currentLines = [];
      return;
    }
    if (currentAgent) currentLines.push(line);
  });
  flush();

  return sections;
}

export async function generateWorkflowOutputs({ agents, project, templates }) {
  if (env.GROQ_API_KEY.startsWith("replace-with")) {
    return Object.fromEntries(agents.map((agent) => [agent.name, fallbackOutput(agent, project, "Groq API key is a placeholder.")]));
  }

  const model = getModel();
  const requiredSections = agents.map((agent) => `## ${agent.name}\nCover: ${agent.output.join(", ")}.`).join("\n\n");
  const prompt = [
    new SystemMessage(
      "You are a concise software planning team. Return plain text only. Do not return JSON, markdown tables, code fences, or machine-readable objects."
    ),
    new HumanMessage(`Create a complete planning pack in one response to reduce API calls.

Project title: ${truncateText(project.title, 120)}
Description: ${truncateText(project.description, 450)}
Requirement: ${truncateText(project.requirement, 900)}

Retrieved reference context:
${compactTemplates(templates) || "No retrieved templates available."}

Use exactly these section headings, in this order. Keep each section concise with short bullets or short paragraphs:

${requiredSections}`)
  ];

  let response;
  try {
    response = await model.invoke(prompt);
  } catch (error) {
    console.warn("Groq workflow generation failed, using fallback:", error.message);
    return Object.fromEntries(agents.map((agent) => [agent.name, fallbackOutput(agent, project, `Groq generation failed: ${error.message}`)]));
  }

  const text = response.content?.toString() || "";
  const sections = parseWorkflowSections(text, agents);

  return Object.fromEntries(
    agents.map((agent) => [
      agent.name,
      sections[agent.name] || fallbackOutput(agent, project, "Groq response missed this plain-text section, so fallback text was used.")
    ])
  );
}
