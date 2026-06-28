import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";

interface ComingSoonProps { title: string; description: string }

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="surface-elevated p-10 text-center">
        <div className="size-14 rounded-2xl mx-auto grid place-items-center mb-5" style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}>
          <Construction className="size-7 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">{description}</p>
        <div className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-primary px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          Em desenvolvimento
        </div>
      </div>
    </div>
  );
}

// Helper to build a route file quickly
export function comingSoonRoute(path: any, title: string, description: string) {
  return createFileRoute(path)({
    head: () => ({ meta: [{ title: `${title} — Tobar OS` }] }),
    component: () => <ComingSoon title={title} description={description} />,
  });
}
