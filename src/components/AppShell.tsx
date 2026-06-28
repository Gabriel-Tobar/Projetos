import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, CheckSquare, Calendar, Flame, Target, NotebookPen,
  Briefcase, Users, Wallet, BookOpen, GraduationCap, Dumbbell, Apple,
  Sparkles, LogOut, Search, Settings, ChevronRight,
} from "lucide-react";
import { progressInLevel, streakEmoji } from "@/lib/gamification";
import { cn } from "@/lib/utils";

interface NavItem { to: string; label: string; icon: typeof LayoutDashboard; soon?: boolean }

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Principal",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/tasks", label: "Tarefas", icon: CheckSquare },
      { to: "/agenda", label: "Agenda", icon: Calendar },
      { to: "/habits", label: "Hábitos", icon: Flame },
      { to: "/goals", label: "Metas", icon: Target },
      { to: "/notes", label: "Anotações", icon: NotebookPen },
    ],
  },
  {
    section: "Trabalho",
    items: [
      { to: "/work", label: "Elo Marketing", icon: Briefcase },
      { to: "/freelancers", label: "Freelancers", icon: Users },
      { to: "/finance", label: "Financeiro", icon: Wallet },
    ],
  },
  {
    section: "Crescimento",
    items: [
      { to: "/studies", label: "Estudos", icon: BookOpen },
      { to: "/courses", label: "Cursos", icon: GraduationCap },
      { to: "/workout", label: "Treino", icon: Dumbbell },
      { to: "/nutrition", label: "Alimentação", icon: Apple },
      { to: "/ai", label: "IA", icon: Sparkles },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const { data: stats } = useQuery({
    queryKey: ["user_stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_stats").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const xp = stats?.xp ?? 0;
  const lvl = progressInLevel(xp);
  const streak = stats?.current_streak ?? 0;

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  const initials = (profile?.full_name ?? user?.email ?? "U").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-sidebar-border bg-sidebar transition-transform md:translate-x-0 md:static md:flex md:flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="size-9 rounded-xl grid place-items-center" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="size-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display font-semibold leading-none">Tobar OS</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Life Operating System</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV.map(group => (
            <div key={group.section}>
              <div className="px-2 mb-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{group.section}</div>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const active = pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.soon && <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70">em breve</span>}
                      {active && <ChevronRight className="size-3 text-primary" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-sidebar-border">
          <Link to="/profile" className="flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent transition-colors">
            <div className="size-9 rounded-full grid place-items-center text-xs font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{profile?.full_name ?? "Gabriel"}</div>
              <div className="text-[11px] text-muted-foreground truncate">Nível {lvl.level} • {xp} XP</div>
            </div>
            <button onClick={(e) => { e.preventDefault(); signOut(); }} className="p-1.5 rounded-md hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="size-4" />
            </button>
          </Link>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-border">
          <div className="flex items-center gap-3 px-4 md:px-8 h-14">
            <button className="md:hidden p-2 -ml-2" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
              <Settings className="size-5" />
            </button>
            <div className="flex-1 relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Pesquisar… (em breve)"
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-muted border border-transparent focus:border-primary/40 focus:outline-none text-sm transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              {streak > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-sm">
                  <span>{streakEmoji(streak)}</span>
                  <span className="text-xs text-muted-foreground">{streak} {streak === 1 ? "dia" : "dias"}</span>
                </div>
              )}
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted">
                <span className="text-xs font-mono text-primary">LVL {lvl.level}</span>
                <div className="w-16 h-1.5 rounded-full bg-background overflow-hidden">
                  <div className="h-full transition-all" style={{ width: `${lvl.percent}%`, background: "var(--gradient-primary)" }} />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
