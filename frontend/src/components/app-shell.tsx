"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, FileText, FolderKanban, GraduationCap, LogOut, Plus, UserCircle, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/projects/new", label: "New Project", icon: Plus },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/agents", label: "Agent Execution", icon: Workflow },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/profile", label: "Profile", icon: UserCircle }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
    router.refresh();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-card/95 shadow-sm backdrop-blur lg:block">
        <div className="flex h-20 items-center border-b px-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="ml-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Student Studio</p>
            <h1 className="text-lg font-semibold">Planning Copilot</h1>
          </div>
        </div>
        <nav className="space-y-1 p-4">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                  pathname.startsWith(item.href) && "bg-primary/10 text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-4 right-4 rounded-lg border bg-secondary/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-foreground">Workflow</p>
          <p className="mt-1 text-sm text-secondary-foreground/80">Intake, n8n trigger, AI agents, and readable report exports.</p>
        </div>
      </aside>
      <main className="lg:pl-72">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/85 px-4 backdrop-blur lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Academic builder workspace</p>
            <h2 className="font-semibold">Program Planning Console</h2>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </header>
        <div className="mx-auto max-w-7xl p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
