"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RotateCw } from "lucide-react";
import { AgentExecutionView } from "@/components/agent-execution";
import { Button } from "@/components/ui/button";
import { api, AgentExecution } from "@/lib/api";

export default function ProjectAgentsPage() {
  const params = useParams<{ id: string }>();
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const load = () => api<AgentExecution[]>(`/projects/${params.id}/executions`).then(setExecutions).catch(() => setExecutions([]));
    load();
    const interval = window.setInterval(load, 2500);
    return () => window.clearInterval(interval);
  }, [params.id]);

  async function rerun() {
    setError("");
    setRunning(true);
    try {
      await api(`/projects/${params.id}/execute`, { method: "POST" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Workflow failed to start");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold">Agent Execution</h1>
          <p className="text-sm text-muted-foreground">The webhook receives the user input first, then each specialist agent produces the planning output.</p>
        </div>
        <Button variant="outline" onClick={rerun} disabled={running}>
          <RotateCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
          Run Again
        </Button>
      </div>
      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <AgentExecutionView executions={executions} />
    </div>
  );
}
