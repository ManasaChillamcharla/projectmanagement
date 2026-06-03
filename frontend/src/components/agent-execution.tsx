"use client";

import { CheckCircle2, CircleDashed, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentExecution } from "@/lib/api";

const agentNames = [
  "Requirement Analyzer",
  "PRD Generator",
  "Architecture Agent",
  "Sprint Planner",
  "Risk Analyzer",
  "Status Reporter",
  "Automation Strategy Agent"
];

function StatusIcon({ status }: { status?: AgentExecution["status"] }) {
  if (status === "completed") return <CheckCircle2 className="h-5 w-5 text-primary" />;
  if (status === "failed") return <XCircle className="h-5 w-5 text-destructive" />;
  if (status === "running") return <Loader2 className="h-5 w-5 animate-spin text-amber-600" />;
  return <CircleDashed className="h-5 w-5 text-muted-foreground" />;
}

function titleFromKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function outputToText(output: unknown, depth = 0): string {
  if (output === null || output === undefined) return "";
  if (typeof output === "string") return output;
  if (typeof output === "number" || typeof output === "boolean") return String(output);

  const indent = "  ".repeat(depth);

  if (Array.isArray(output)) {
    return output
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          return `${indent}- ${outputToText(item, depth + 1).trim()}`;
        }
        return `${indent}- ${outputToText(item, depth + 1)}`;
      })
      .join("\n");
  }

  if (typeof output === "object") {
    return Object.entries(output as Record<string, unknown>)
      .map(([key, value]) => {
        const formattedValue = outputToText(value, depth + 1).trim();
        if (!formattedValue) return "";
        if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
          return `${indent}${titleFromKey(key)}:\n${formattedValue}`;
        }
        return `${indent}${titleFromKey(key)}: ${formattedValue}`;
      })
      .filter(Boolean)
      .join("\n\n");
  }

  return String(output);
}

function AgentOutput({ output }: { output?: unknown }) {
  if (!output) {
    return (
      <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
        Waiting for this agent to produce an output.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-sm leading-6 whitespace-pre-wrap">
        {outputToText(output)}
      </div>
    </div>
  );
}

export function AgentExecutionView({ executions }: { executions: AgentExecution[] }) {
  return (
    <div className="grid gap-4">
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {["User input", "n8n webhook", "Agent planning", "Report output"].map((step, index) => (
            <div key={step} className="flex items-center gap-3">
              <Badge className={index === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}>{step}</Badge>
              {index < 3 && <span className="text-muted-foreground">/</span>}
            </div>
          ))}
        </div>
      </div>
      {agentNames.map((name) => {
        const execution = executions.find((item) => item.agentName === name);
        return (
          <Card key={name} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                  <StatusIcon status={execution?.status} />
                </div>
                <div>
                  <CardTitle className="text-base">{name}</CardTitle>
                  <p className="text-xs text-muted-foreground">Planning specialist output</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{execution?.status || "queued"}</Badge>
                <Badge className="font-mono">{execution?.executionTime ? `${execution.executionTime}ms` : "0ms"}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {execution?.error && (
                <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {execution.error}
                </p>
              )}
              <AgentOutput output={execution?.output} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
