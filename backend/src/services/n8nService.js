import { env } from "../config/env.js";

function buildPlanningText(project, projectId) {
  return [
    "Project planning required",
    `Project ID: ${projectId}`,
    `Title: ${project.title}`,
    project.description ? `Description: ${project.description}` : null,
    `Status: ${project.status}`,
    "",
    "Requirement:",
    project.requirement,
    "",
    `Project URL: ${env.FRONTEND_URL}/projects/${projectId}/agents`,
    `Executions URL: ${env.BACKEND_URL}/api/projects/${projectId}/executions`
  ].filter(Boolean).join("\n");
}

function webhookUrls() {
  if (!env.N8N_PROJECT_PLANNING_WEBHOOK_URL) return [];

  const urls = [env.N8N_PROJECT_PLANNING_WEBHOOK_URL];
  if (env.N8N_PROJECT_PLANNING_WEBHOOK_URL.includes("/webhook-test/")) {
    urls.push(env.N8N_PROJECT_PLANNING_WEBHOOK_URL.replace("/webhook-test/", "/webhook/"));
  } else if (env.N8N_PROJECT_PLANNING_WEBHOOK_URL.includes("/webhook/")) {
    urls.push(env.N8N_PROJECT_PLANNING_WEBHOOK_URL.replace("/webhook/", "/webhook-test/"));
  }

  return [...new Set(urls)];
}

function buildWebhookPayload(project, projectId, planningText) {
  return {
    event: "project.planning.required",
    project: {
      id: projectId,
      title: project.title,
      description: project.description,
      requirement: project.requirement,
      status: project.status,
      owner: project.owner?.toString?.() || project.owner
    },
    links: {
      projectUrl: `${env.FRONTEND_URL}/projects/${projectId}/agents`,
      executionsUrl: `${env.BACKEND_URL}/api/projects/${projectId}/executions`
    },
    text: planningText,
    triggeredAt: new Date().toISOString()
  };
}

async function postWebhook(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text().catch(() => "");
  if (!response.ok) {
    return {
      ok: false,
      url,
      status: response.status,
      body: responseText || response.statusText
    };
  }

  if (!responseText) return { ok: true, url, status: response.status };

  try {
    return { ok: true, url, status: response.status, body: JSON.parse(responseText) };
  } catch {
    return { ok: true, url, status: response.status, body: responseText };
  }
}

export async function notifyProjectPlanningWebhook(project) {
  const urls = webhookUrls();
  if (!urls.length) return null;

  const projectId = project._id.toString();
  const planningText = buildPlanningText(project, projectId);
  const payload = buildWebhookPayload(project, projectId, planningText);
  const attempts = [];

  for (const url of urls) {
    const attempt = await postWebhook(url, payload);
    attempts.push(attempt);
    if (attempt.ok) {
      return {
        status: "sent",
        url,
        responseStatus: attempt.status,
        body: attempt.body,
        fallbackUsed: url !== urls[0],
        attempts
      };
    }
  }

  const summary = attempts.map((attempt) => `${attempt.url} -> ${attempt.status}: ${attempt.body}`).join(" | ");
  throw new Error(`n8n webhook failed for all configured URLs. ${summary}`);
}
