import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Dumbbell, Trash2, Flame } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/workout")({
  head: () => ({ meta: [{ title: "Treino — Tobar OS" }] }),
  component: WorkoutPage,
});

interface Exercise { name: string; sets: number; reps: number; weight: number }

function WorkoutPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Força", duration_min: "60", intensity: "moderada", notes: "", performed_on: new Date().toISOString().slice(0,10) });
  const [exercises, setExercises] = useState<Exercise[]>([{ name: "", sets: 3, reps: 10, weight: 0 }]);

  const { data: workouts } = useQuery({
    queryKey: ["workouts", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("workouts").select("*").eq("user_id", user!.id).order("performed_on", { ascending: false }).limit(100)).data ?? [],
  });

  const create = async () => {
    if (!form.name.trim() || !user) return;
    const filtered = exercises.filter(e => e.name.trim());
    const { error } = await supabase.from("workouts").insert({
      user_id: user.id, name: form.name, category: form.category, duration_min: Number(form.duration_min) || null as any,
      intensity: form.intensity, exercises: filtered as any, notes: form.notes || null, performed_on: form.performed_on,
    });
    if (error) return toast.error(error.message);
    setForm({ name: "", category: "Força", duration_min: "60", intensity: "moderada", notes: "", performed_on: new Date().toISOString().slice(0,10) });
    setExercises([{ name: "", sets: 3, reps: 10, weight: 0 }]);
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["workouts"] });
    toast.success("Treino registrado 💪");
  };
  const remove = async (id: string) => { await supabase.from("workouts").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["workouts"] }); };
  const updateEx = (i: number, key: keyof Exercise, v: any) => setExercises(arr => arr.map((e, idx) => idx === i ? { ...e, [key]: v } : e));

  const { weekCount, monthMin, byCategory } = useMemo(() => {
    const all = workouts ?? [];
    const weekAgo = new Date(Date.now() - 7*86400000).toISOString().slice(0,10);
    const monthAgo = new Date(Date.now() - 30*86400000).toISOString().slice(0,10);
    const weekCount = all.filter(w => w.performed_on >= weekAgo).length;
    const monthMin = all.filter(w => w.performed_on >= monthAgo).reduce((s, w) => s + (w.duration_min ?? 0), 0);
    const byCategory: Record<string, number> = {};
    all.forEach(w => { if (w.category) byCategory[w.category] = (byCategory[w.category] ?? 0) + 1; });
    return { weekCount, monthMin, byCategory };
  }, [workouts]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Treino</h1>
          <p className="text-sm text-muted-foreground mt-1">Histórico, séries e evolução.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1" /> Novo treino</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Novo treino</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Peito + Tríceps" autoFocus /></div>
                <div>
                  <Label>Categoria</Label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full h-9 rounded-md bg-input border border-border px-3 text-sm">
                    {["Força", "Hipertrofia", "Cardio", "HIIT", "Mobilidade", "Funcional"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Duração (min)</Label><Input type="number" value={form.duration_min} onChange={e => setForm({ ...form, duration_min: e.target.value })} /></div>
                <div>
                  <Label>Intensidade</Label>
                  <select value={form.intensity} onChange={e => setForm({ ...form, intensity: e.target.value })} className="w-full h-9 rounded-md bg-input border border-border px-3 text-sm">
                    {["leve", "moderada", "intensa"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><Label>Data</Label><Input type="date" value={form.performed_on} onChange={e => setForm({ ...form, performed_on: e.target.value })} /></div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2"><Label>Exercícios</Label>
                  <button onClick={() => setExercises(a => [...a, { name: "", sets: 3, reps: 10, weight: 0 }])} className="text-xs text-primary hover:underline">+ adicionar</button>
                </div>
                <div className="space-y-2">
                  {exercises.map((e, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <Input className="col-span-5" placeholder="Exercício" value={e.name} onChange={x => updateEx(i, "name", x.target.value)} />
                      <Input className="col-span-2" type="number" placeholder="séries" value={e.sets} onChange={x => updateEx(i, "sets", Number(x.target.value))} />
                      <Input className="col-span-2" type="number" placeholder="reps" value={e.reps} onChange={x => updateEx(i, "reps", Number(x.target.value))} />
                      <Input className="col-span-2" type="number" placeholder="kg" value={e.weight} onChange={x => updateEx(i, "weight", Number(x.target.value))} />
                      <button onClick={() => setExercises(a => a.filter((_,idx) => idx !== i))} className="col-span-1 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div><Label>Notas</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={create}>Salvar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="surface-elevated p-5"><div className="text-xs text-muted-foreground">Esta semana</div><div className="text-2xl font-display font-bold mt-1 text-gradient">{weekCount} treinos</div></div>
        <div className="surface-elevated p-5"><div className="text-xs text-muted-foreground">Últimos 30 dias</div><div className="text-2xl font-display font-bold mt-1">{Math.floor(monthMin/60)}h {monthMin%60}min</div></div>
        <div className="surface-elevated p-5"><div className="text-xs text-muted-foreground">Total</div><div className="text-2xl font-display font-bold mt-1">{(workouts ?? []).length}</div></div>
      </div>

      {Object.keys(byCategory).length > 0 && (
        <div className="surface-card p-5">
          <h2 className="font-display font-semibold mb-3">Distribuição por categoria</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byCategory).map(([cat, n]) => (
              <div key={cat} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs">{cat} <span className="font-mono text-muted-foreground">×{n}</span></div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {(workouts ?? []).length === 0 ? (
          <div className="surface-card p-12 text-center"><Dumbbell className="size-10 mx-auto text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">Nenhum treino registrado.</p></div>
        ) : (workouts ?? []).map(w => {
          const exs = (w.exercises as any[]) ?? [];
          return (
            <div key={w.id} className="surface-card p-5 group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl grid place-items-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}><Dumbbell className="size-5" /></div>
                  <div>
                    <div className="font-display font-semibold">{w.name}</div>
                    <div className="text-xs text-muted-foreground">{w.category} • {w.duration_min ?? "-"}min • <Flame className="size-3 inline" /> {w.intensity} • {format(new Date(w.performed_on), "d MMM", { locale: ptBR })}</div>
                  </div>
                </div>
                <button onClick={() => remove(w.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
              </div>
              {exs.length > 0 && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  {exs.map((e, i) => (
                    <div key={i} className="px-3 py-2 rounded-lg bg-muted">
                      <div className="font-medium">{e.name}</div>
                      <div className="text-muted-foreground font-mono mt-0.5">{e.sets}×{e.reps} • {e.weight}kg</div>
                    </div>
                  ))}
                </div>
              )}
              {w.notes && <p className="text-xs text-muted-foreground mt-2">{w.notes}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
