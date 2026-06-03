"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Activity, CheckCircle2, FileText, FolderKanban, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

type Analytics = {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  riskScore: number;
  generatedReports: number;
  statusDistribution: Record<string, number>;
  sprintProgress: { name: string; value: number }[];
  riskDistribution: { name: string; value: number }[];
};

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    api<Analytics>("/dashboard/analytics").then(setAnalytics).catch(() => {
      setAnalytics({
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        riskScore: 0,
        generatedReports: 0,
        statusDistribution: { Draft: 0, Planning: 0, Active: 0 },
        sprintProgress: [],
        riskDistribution: []
      });
    });
  }, []);

  const cards = [
    ["Total Projects", analytics?.totalProjects ?? 0, FolderKanban],
    ["Active Projects", analytics?.activeProjects ?? 0, Activity],
    ["Completed Projects", analytics?.completedProjects ?? 0, CheckCircle2],
    ["Risk Score", analytics?.riskScore ?? 0, ShieldAlert],
    ["Generated Reports", analytics?.generatedReports ?? 0, FileText]
  ] as const;
  const statusData = Object.entries(analytics?.statusDistribution || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground">Portfolio health, delivery progress, and generated planning intelligence for your program builds.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value, Icon]) => (
          <Card key={label} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Project Status Distribution</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90}>
                  {statusData.map((_, index) => <Cell key={index} fill={["#0f9f8f", "#f2b84b", "#334155"][index % 3]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Sprint Progress</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <BarChart data={analytics?.sprintProgress || []}>
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="value" fill="#0f9f8f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Risk Distribution</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <BarChart data={analytics?.riskDistribution || []}>
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="value" fill="#e15b3f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
