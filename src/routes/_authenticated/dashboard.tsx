import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { progressInLevel, streakEmoji } from "@/lib/gamification";
import { CheckSquare, Calendar, Flame, Target, TrendingUp, Trophy, Zap, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Gabriel Tobar OS" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const today = new Date();
  const todayStart = new Date(today); todayStart.setHours(0,0,0,0);
  const todayEnd = new Date(today); todayEnd.setHours(23,59,59,999);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });
  const { data: stats } = useQuery({
    queryKey: ["user_stats", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("user_stats").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });
  const { data: tasks } = useQuery({
    queryKey: ["dashboard-tasks", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("tasks").select("*").eq("user_id", user!.id).neq("status","done").order("due_date", { ascending: true, nullsFirst: false }).limit(5)).data ?? [],
  });
  const { data: events } = useQuery({
    queryKey: ["dashboard-events", user?.id, todayStart.toISOString()],
    enabled: !!user,
    queryFn: async () => (await supabase.from("events").select("*").eq("user_id", user!.id)
      .gte("starts_at", todayStart.toISOString())
      .lte("starts_at", todayEnd.toISOString())
      .order("starts_at")).data ?? [],
  });
  const { data: habits } = useQuery({
    queryKey: ["dashboard-habits", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("habits").select("*").eq("user_id", user!.id).eq("archived", false)).data ?? [],
  });
  const todayStr = today.toISOString().slice(0,10);
  const { data: habitLogs } = useQuery({
    queryKey: ["dashboard-habit-logs", user?.id, todayStr],
    enabled: !!user,
    queryFn: async () => (await supabase.from("habit_logs").select("habit_id").eq("user_id", user!.id).eq("log_date", todayStr)).data ?? [],
  });

  const xp = stats?.xp ?? 0;
  const lvl = progressInLevel(xp);
  const streak = stats?.current_streak ?? 0;
  const habitsDone = habitLogs?.length ?? 0;
  const habitsTotal = habits?.length ?? 0;

  const greeting = (() => {
    const h = today.getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();
  const firstName = (profile?.full_name ?? "Gabriel").split(" ")[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="surface-elevated p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-60" style={{ background: "var(--gradient-glow)" }} />
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground capitalize">
              {format(today, "EEEE, d 'de' MMMM • HH:mm", { locale: ptBR })}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mt-1">
              {greeting}, <span className="text-gradient">{firstName}</span>
            </h1>
            <p className="text-muted-foreground mt-2">Execute como um CEO. Aqui está o seu dia.</p>
          </div>
          <div className="flex items-center gap-6">
            <Stat icon={<Trophy className="size-4 text-primary" />} label="Nível" value={String(lvl.level)} />
            <Stat icon={<Zap className="size-4 text-primary" />} label="XP" value={String(xp)} />
            <Stat icon={<Flame className="size-4 text-primary" />} label="Streak" value={streak > 0 ? `${streakEmoji(streak)} ${streak}d` : "—"} />
          </div>
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Progresso para o nível {lvl.level + 1}</span>
            <span>{lvl.into}/{lvl.span} XP</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full transition-all duration-700" style={{ width: `${lvl.percent}%`, background: "var(--gradient-primary)" }} />
          </div>
        </div>
      </div>

      {/* Cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={<CheckSquare />} label="Tarefas pendentes" value={tasks?.length ?? 0} href="/tasks" />
        <KpiCard icon={<Calendar />} label="Eventos hoje" value={events?.length ?? 0} href="/agenda" />
        <KpiCard icon={<Flame />} label="Hábitos hoje" value={`${habitsDone}/${habitsTotal}`} href="/habits" />
        <KpiCard icon={<TrendingUp />} label="Total concluídas" value={(stats?.total_tasks_completed ?? 0) + (stats?.total_habits_completed ?? 0)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's tasks */}
        <Section title="Tarefas pendentes" icon={<CheckSquare className="size-4" />} actionTo="/tasks" actionLabel="Ver todas">
          {tasks && tasks.length > 0 ? (
            <ul className="space-y-2">
              {tasks.map(t => (
                <li key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                  <PriorityDot p={t.priority} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.title}</div>
                    {t.due_date && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="size-3" /> {format(new Date(t.due_date), "d MMM HH:mm", { locale: ptBR })}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty msg="Sem tarefas pendentes. Você está em dia." />
          )}
        </Section>

        {/* Today's events */}
        <Section title="Agenda de hoje" icon={<Calendar className="size-4" />} actionTo="/agenda" actionLabel="Calendário">
          {events && events.length > 0 ? (
            <ul className="space-y-2">
              {events.map(e => (
                <li key={e.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                  <div className="w-1 h-10 rounded-full bg-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{e.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(e.starts_at), "HH:mm")}
                      {e.ends_at && ` — ${format(new Date(e.ends_at), "HH:mm")}`}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty msg="Nada agendado para hoje." />
          )}
        </Section>

        {/* Habits */}
        <Section title="Hábitos de hoje" icon={<Flame className="size-4" />} actionTo="/habits" actionLabel="Gerenciar">
          {habits && habits.length > 0 ? (
            <ul className="space-y-2">
              {habits.slice(0, 5).map(h => {
                const done = habitLogs?.some(l => l.habit_id === h.id);
                return (
                  <li key={h.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                    <div className={`size-7 rounded-md grid place-items-center ${done ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>
                      <Flame className="size-4" />
                    </div>
                    <span className={`text-sm flex-1 truncate ${done ? "line-through text-muted-foreground" : ""}`}>{h.name}</span>
                    <span className="text-xs text-muted-foreground">{done ? "✓ feito" : "pendente"}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty msg="Crie seus primeiros hábitos." />
          )}
        </Section>

        {/* Goals preview */}
        <Section title="Conquistas" icon={<Target className="size-4" />} actionTo="/goals" actionLabel="Metas">
          <div className="grid grid-cols-2 gap-3">
            <BadgeCard label="Tarefas concluídas" value={stats?.total_tasks_completed ?? 0} />
            <BadgeCard label="Hábitos cumpridos" value={stats?.total_habits_completed ?? 0} />
            <BadgeCard label="Maior streak" value={`${stats?.longest_streak ?? 0}d`} />
            <BadgeCard label="XP total" value={xp} />
          </div>
        </Section>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="text-xl font-display font-semibold mt-1">{value}</div>
    </div>
  );
}

function KpiCard({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string | number; href?: string }) {
  const inner = (
    <div className="surface-card p-4 hover-lift h-full">
      <div className="flex items-center justify-between">
        <div className="size-9 rounded-lg bg-primary/10 grid place-items-center text-primary">{icon}</div>
      </div>
      <div className="text-2xl font-display font-bold mt-3">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
  if (href) return <Link to={href}>{inner}</Link>;
  return inner;
}

function Section({ title, icon, children, actionTo, actionLabel }: { title: string; icon: React.ReactNode; children: React.ReactNode; actionTo?: string; actionLabel?: string }) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><span className="text-primary">{icon}</span><h3 className="font-display font-semibold">{title}</h3></div>
        {actionTo && <Link to={actionTo} className="text-xs text-muted-foreground hover:text-primary transition-colors">{actionLabel} →</Link>}
      </div>
      {children}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <p className="text-sm text-muted-foreground py-6 text-center">{msg}</p>;
}

function BadgeCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-xl font-display font-bold text-gradient">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function PriorityDot({ p }: { p: string }) {
  const c = p === "urgent" ? "bg-destructive" : p === "high" ? "bg-warning" : p === "low" ? "bg-muted-foreground" : "bg-primary";
  return <div className={`size-2 rounded-full ${c}`} />;
}
