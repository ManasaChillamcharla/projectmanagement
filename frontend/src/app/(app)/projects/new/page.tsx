"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Braces, CheckCircle2, CircleAlert, FileText, Network, WandSparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, Project } from "@/lib/api";

type N8nStatus = {
  configured: boolean;
  status: string;
  host?: string;
  path?: string;
  testMode?: boolean;
  message: string;
};

export default function NewProjectPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [n8nStatus, setN8nStatus] = useState<N8nStatus | null>(null);

  useEffect(() => {
    api<N8nStatus>("/integrations/n8n/status").then(setN8nStatus).catch(() => setN8nStatus(null));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const project = await api<Project>("/projects", {
        method: "POST",
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description"),
          requirement: form.get("requirement")
        })
      });
      await api(`/projects/${project._id}/execute`, { method: "POST" });
      router.push(`/projects/${project._id}/agents`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Project creation failed");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10">Webhook-first Intake</Badge>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-normal">Ask once. Trigger n8n. Generate the complete planning pack.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Enter the program idea, constraints, and expected output. The webhook receives your input first, then the AI agents generate requirements, architecture, sprint tasks, risks, and reports.
          </p>
          <div className="mt-5 flex items-start gap-3 rounded-md border bg-background p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
              {n8nStatus?.configured ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <CircleAlert className="h-5 w-5 text-amber-600" />}
            </div>
            <div>
              <p className="text-sm font-semibold">{n8nStatus?.configured ? "n8n webhook configured" : "n8n webhook not confirmed"}</p>
              <p className="text-sm text-muted-foreground">{n8nStatus?.message || "Status check is unavailable right now."}</p>
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[
            [Braces, "Input", "Program requirement"],
            [Network, "Trigger", "n8n webhook"],
            [FileText, "Output", "Readable reports"]
          ].map(([Icon, label, text]) => (
            <div key={String(label)} className="flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{String(label)}</p>
                <p className="text-xs text-muted-foreground">{String(text)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Requirement Intake</CardTitle>
          <CardDescription>Example: Build a library management system with login, book issue tracking, fines, and admin reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input name="title" placeholder="Project title" required />
              <Input name="description" placeholder="Short description" />
            </div>
            <Textarea
              className="min-h-48"
              name="requirement"
              placeholder="Describe the software product, users, modules, database needs, screens, constraints, and expected outcomes."
              required
              minLength={10}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button disabled={loading}>
              <WandSparkles className="h-4 w-4" />
              {loading ? "Triggering n8n and agents..." : "Start Multi-Agent Planning"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
