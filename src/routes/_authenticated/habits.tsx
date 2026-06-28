import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { awardXp, streakEmoji } from "@/lib/gamification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Flame, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/habits")({
  head: () => ({ meta: [{ title: "Hábitos — Tobar OS" }] }),
  component: HabitsPage,
});

function HabitsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const { data: habits } = useQuery({
    queryKey: ["habits", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("habits").select("*").eq("user_id", user!.id).eq("archived", false).order("created_at")).data ?? [],
  });
  const { data: todayLogs } = useQuery({
    queryKey: ["habit-logs-today", user?.id, today],
    enabled: !!user,
    queryFn: async () => (await supabase.from("habit_logs").select("*").eq("user_id", user!.id).eq("log_date", today)).data ?? [],
  });
  const { data: stats } = useQuery({
    queryKey: ["user_stats", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("user_stats").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });
  const { data: weekLogs } = useQuery({
    queryKey: ["habit-logs-week", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - 6);
      return (await supabase.from("habit_logs").select("*").eq("user_id", user!.id)
        .gte("log_date", since.toISOString().slice(0,10))).data ?? [];
    },
  });

  const create = async () => {
    if (!name.trim() || !user) return;
    const { error } = await supabase.from("habits").insert({ user_id: user.id, name, description: desc || null });
    if (error) return toast.error(error.message);
    setName(""); setDesc(""); setOpen(false);
    qc.invalidateQueries({ queryKey: ["habits"] });
  };

  const toggle = async (habitId: string) => {
    if (!user) return;
    const existing = todayLogs?.find(l => l.habit_id === habitId);
    if (existing) {
      await supabase.from("habit_logs").delete().eq("id", existing.id);
      qc.invalidateQueries({ queryKey: ["habit-logs-today"] });
      qc.invalidateQueries({ queryKey: ["habit-logs-week"] });
    } else {
      const { error } = await supabase.from("habit_logs").insert({ user_id: user.id, habit_id: habitId, log_date: today });
      if (error) return toast.error(error.message);
      await awardXp(user.id, 5, "habit");
      toast.success("🔥 +5 XP");
      qc.invalidateQueries({ queryKey: ["habit-logs-today"] });
      qc.invalidateQueries({ queryKey: ["habit-logs-week"] });
      qc.invalidateQueries({ queryKey: ["user_stats"] });
    }
  };

  const remove = async (id: string) => {
    await supabase.from("habits").update({ archived: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["habits"] });
  };

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0,10);
  });

  const streak = stats?.current_streak ?? 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hábitos</h1>
          <p className="text-sm text-muted-foreground mt-1">Construa sua sequência. Cada hábito vale +5 XP.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1" /> Novo hábito</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo hábito</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Ler 30 min" autoFocus /></div>
              <div><Label>Descrição</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={create}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Streak hero */}
      <div className="surface-elevated p-6 flex items-center gap-6">
        <div className="text-5xl">{streak > 0 ? streakEmoji(streak) : "✨"}</div>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground">Sequência atual</div>
          <div className="text-3xl font-display font-bold">{streak} {streak === 1 ? "dia" : "dias"}</div>
          <div className="text-xs text-muted-foreground mt-1">Maior sequência: {stats?.longest_streak ?? 0} dias</div>
        </div>
      </div>

      <div className="space-y-3">
        {(habits ?? []).length === 0 ? (
          <div className="surface-card p-12 text-center">
            <Flame className="size-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum hábito ainda. Crie o primeiro.</p>
          </div>
        ) : (
          (habits ?? []).map(h => {
            const done = todayLogs?.some(l => l.habit_id === h.id);
            return (
              <div key={h.id} className="surface-card p-4 flex items-center gap-4 group">
                <button
                  onClick={() => toggle(h.id)}
                  className={`size-12 rounded-xl grid place-items-center transition-all ${
                    done ? "text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  style={done ? { background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" } : undefined}
                >
                  {done ? <Check className="size-5" /> : <Flame className="size-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${done ? "text-muted-foreground line-through" : ""}`}>{h.name}</div>
                  {h.description && <div className="text-xs text-muted-foreground mt-0.5">{h.description}</div>}
                </div>
                <div className="hidden sm:flex items-center gap-1">
                  {last7.map(d => {
                    const did = weekLogs?.some(l => l.habit_id === h.id && l.log_date === d);
                    return <div key={d} className={`size-2.5 rounded-full ${did ? "bg-primary" : "bg-muted"}`} title={d} />;
                  })}
                </div>
                <button onClick={() => remove(h.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
