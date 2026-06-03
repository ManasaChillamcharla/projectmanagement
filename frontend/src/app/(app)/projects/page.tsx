"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle2, CircleAlert, FolderKanban, Plus, Trash2, Workflow, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { api, Project } from "@/lib/api";

type N8nStatus = {
  configured: boolean;
  status: string;
  host?: string;
  path?: string;
  testMode?: boolean;
  message: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [n8nStatus, setN8nStatus] = useState<N8nStatus | null>(null);
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    api<Project[]>("/projects").then(setProjects).catch(() => setProjects([]));
    api<N8nStatus>("/integrations/n8n/status").then(setN8nStatus).catch(() => setN8nStatus(null));
  }, []);

  async function deleteProject(project: Project) {
    const confirmed = window.confirm(`Delete "${project.title}" and its generated reports?`);
    if (!confirmed) return;

    setDeletingId(project._id);
    try {
      await api(`/projects/${project._id}`, { method: "DELETE" });
      setProjects((items) => items.filter((item) => item._id !== project._id));
    } finally {
      setDeletingId("");
    }
  }

  const activeProjects = projects.filter((project) => project.status === "Active").length;
  const planningProjects = projects.filter((project) => project.status === "Planning").length;
  const stats: { label: string; value: number; icon: LucideIcon }[] = [
    { label: "Total", value: projects.length, icon: FolderKanban },
    { label: "Planning", value: planningProjects, icon: Workflow },
    { label: "Active", value: activeProjects, icon: CheckCircle2 }
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10">AI Planning Command Center</Badge>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-normal">Projects ready for webhook-first planning.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Create a project, send the requirement to n8n, then review the generated planning pack, architecture, reports, and exports from one workspace.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/projects/new">
                  <Plus className="h-4 w-4" />
                  New Project
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/agents">
                  <Workflow className="h-4 w-4" />
                  Agent Console
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-md border bg-background p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              {n8nStatus?.configured ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <CircleAlert className="h-5 w-5 text-amber-600" />}
            </div>
            <div>
              <p className="text-sm font-semibold">n8n Webhook Connection</p>
              <p className="text-sm text-muted-foreground">
                {n8nStatus ? n8nStatus.message : "Webhook status unavailable. Check backend auth or integration route."}
              </p>
              {n8nStatus?.host && (
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {n8nStatus.host}
                  {n8nStatus.path}
                </p>
              )}
            </div>
          </div>
          <Badge className={n8nStatus?.configured ? "bg-primary text-primary-foreground" : "bg-amber-100 text-amber-900 hover:bg-amber-100"}>
            {n8nStatus?.configured ? (n8nStatus.testMode ? "Test webhook" : "Connected") : "Not configured"}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Portfolio</CardTitle>
          <CardDescription>Open a workspace, inspect agent output, or delete old demo projects before submission.</CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="rounded-md border border-dashed bg-muted/40 p-8 text-center">
              <FolderKanban className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No projects yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create one project to trigger n8n and generate the planning pack.</p>
              <Button asChild className="mt-4">
                <Link href="/projects/new">Create Project</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Project</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project._id} className="border-t transition-colors hover:bg-muted/40">
                    <Td>
                      <div>
                        <p className="font-medium">{project.title}</p>
                        <p className="line-clamp-1 text-xs text-muted-foreground">{project.description || project.requirement}</p>
                      </div>
                    </Td>
                    <Td>
                      <Badge>{project.status}</Badge>
                    </Td>
                    <Td>{new Date(project.createdAt).toLocaleDateString()}</Td>
                    <Td>
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/projects/${project._id}`}>
                            Open
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          aria-label={`Delete ${project.title}`}
                          disabled={deletingId === project._id}
                          onClick={() => deleteProject(project)}
                          size="icon"
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
