"use client";

import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, FileText, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, exportUrl, getToken, Project } from "@/lib/api";

export default function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    api<Project[]>("/projects").then(setProjects).catch(() => setProjects([]));
  }, []);

  async function download(project: Project, type: "pdf" | "docx" | "sprint-xlsx") {
    const response = await fetch(exportUrl(project._id, type), {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    const blob = await response.blob();
    const href = URL.createObjectURL(blob);
    const extension = type === "sprint-xlsx" ? "xlsx" : type;
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `${project.title}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">Export readable planning packs, stakeholder documents, and sprint sheets without raw JSON blocks.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <Card key={project._id}>
            <CardHeader>
              <CardTitle className="text-lg">{project.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
              <Button variant="outline" onClick={() => download(project, "pdf")}>
                <ScrollText className="h-4 w-4" />
                PDF
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => download(project, "docx")}>
                <FileText className="h-4 w-4" />
                Word
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => download(project, "sprint-xlsx")}>
                <FileSpreadsheet className="h-4 w-4" />
                Excel
                <Download className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
