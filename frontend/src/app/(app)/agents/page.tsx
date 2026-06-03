"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, Project } from "@/lib/api";

export default function AgentsIndexPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    api<Project[]>("/projects").then(setProjects).catch(() => setProjects([]));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Agent Execution</h1>
        <p className="text-sm text-muted-foreground">Choose a project to inspect its seven-agent planning workflow.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <Card key={project._id}>
            <CardHeader><CardTitle>{project.title}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="line-clamp-3 text-sm text-muted-foreground">{project.requirement}</p>
              <Button asChild variant="outline"><Link href={`/projects/${project._id}/agents`}>Open Workflow</Link></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
