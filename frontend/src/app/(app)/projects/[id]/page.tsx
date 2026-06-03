"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, FileText, Network, Play, Trash2, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, Project } from "@/lib/api";

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [working, setWorking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<Project>(`/projects/${params.id}`).then(setProject).catch(() => setError("Project could not be loaded."));
  }, [params.id]);

  async function runWorkflow() {
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const result = await api<{ message: string; webhook?: { status?: string; message?: string } }>(`/projects/${params.id}/execute`, { method: "POST" });
      const webhookText = result.webhook?.message ? ` Webhook: ${result.webhook.message}` : "";
      setMessage(`${result.message}.${webhookText}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Workflow failed to start.");
    } finally {
      setWorking(false);
    }
  }

  async function deleteProject() {
    if (!project) return;
    const confirmed = window.confirm(`Delete "${project.title}" and all generated reports?`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      await api(`/projects/${project._id}`, { method: "DELETE" });
      router.push("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Project delete failed.");
      setDeleting(false);
    }
  }

  if (!project) return <p className="text-sm text-muted-foreground">Loading project...</p>;

  const workflowSteps: { icon: LucideIcon; title: string; text: string }[] = [
    { icon: Network, title: "1. Webhook", text: "Requirement is sent to n8n first." },
    { icon: CheckCircle2, title: "2. Agents", text: "Planning agents generate readable text output." },
    { icon: FileText, title: "3. Reports", text: "Exports stay available after completion." }
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10">{project.status}</Badge>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-normal">{project.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{project.description || "Project workspace ready for webhook-first planning."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={working} onClick={runWorkflow}>
              <Play className={`h-4 w-4 ${working ? "animate-pulse" : ""}`} />
              {working ? "Triggering..." : "Trigger n8n + Agents"}
            </Button>
            <Button asChild variant="outline">
              <Link href={`/projects/${project._id}/agents`}>
                View Outputs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button disabled={deleting} onClick={deleteProject} variant="destructive">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </section>

      {(message || error) && (
        <div className={`rounded-md border px-4 py-3 text-sm ${error ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-primary/30 bg-primary/10 text-primary"}`}>
          {error || message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {workflowSteps.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 text-sm font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requirement</CardTitle>
          <CardDescription>This is the exact user question/requirement sent into the webhook and agent workflow.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm leading-6">{project.requirement}</p>
        </CardContent>
      </Card>
    </div>
  );
}
