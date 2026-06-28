import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Apple, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/nutrition")({
  head: () => ({ meta: [{ title: "Alimentação — Tobar OS" }] }),
  component: NutritionPage,
});

const MEAL_TYPES = ["Café da manhã", "Almoço", "Lanche", "Jantar", "Ceia"];

function NutritionPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ meal_type: "Café da manhã", description: "", calories: "", protein: "", carbs: "", fat: "", consumed_on: new Date().toISOString().slice(0,10) });

  const { data: meals } = useQuery({
    queryKey: ["meals", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("meals").select("*").eq("user_id", user!.id).order("consumed_on", { ascending: false }).limit(100)).data ?? [],
  });

  const create = async () => {
    if (!form.description.trim() || !user) return;
    const { error } = await supabase.from("meals").insert({
      user_id: user.id, meal_type: form.meal_type, description: form.description,
      calories: form.calories ? Number(form.calories) : null,
      protein: form.protein ? Number(form.protein) : null,
      carbs: form.carbs ? Number(form.carbs) : null,
      fat: form.fat ? Number(form.fat) : null,
      consumed_on: form.consumed_on,
    });
    if (error) return toast.error(error.message);
    setForm({ meal_type: "Café da manhã", description: "", calories: "", protein: "", carbs: "", fat: "", consumed_on: new Date().toISOString().slice(0,10) });
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["meals"] });
    toast.success("Refeição registrada");
  };
  const remove = async (id: string) => { await supabase.from("meals").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["meals"] }); };

  const today = new Date().toISOString().slice(0,10);
  const todayMeals = (meals ?? []).filter(m => m.consumed_on === today);
  const totals = useMemo(() => ({
    cal: todayMeals.reduce((s, m) => s + (m.calories ?? 0), 0),
    p: todayMeals.reduce((s, m) => s + (m.protein ?? 0), 0),
    c: todayMeals.reduce((s, m) => s + (m.carbs ?? 0), 0),
    f: todayMeals.reduce((s, m) => s + (m.fat ?? 0), 0),
  }), [todayMeals]);

  const groupedByDate: Record<string, typeof todayMeals> = {};
  (meals ?? []).forEach(m => { (groupedByDate[m.consumed_on] ??= []).push(m as any); });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alimentação</h1>
          <p className="text-sm text-muted-foreground mt-1">Refeições, calorias e macros do dia.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1" /> Refeição</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova refeição</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Tipo</Label>
                <select value={form.meal_type} onChange={e => setForm({ ...form, meal_type: e.target.value })} className="w-full h-9 rounded-md bg-input border border-border px-3 text-sm">
                  {MEAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div><Label>Descrição</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ex: 2 ovos + aveia + banana" autoFocus /></div>
              <div className="grid grid-cols-4 gap-2">
                <div><Label className="text-[10px]">Kcal</Label><Input type="number" value={form.calories} onChange={e => setForm({ ...form, calories: e.target.value })} /></div>
                <div><Label className="text-[10px]">Prot (g)</Label><Input type="number" value={form.protein} onChange={e => setForm({ ...form, protein: e.target.value })} /></div>
                <div><Label className="text-[10px]">Carb (g)</Label><Input type="number" value={form.carbs} onChange={e => setForm({ ...form, carbs: e.target.value })} /></div>
                <div><Label className="text-[10px]">Gord (g)</Label><Input type="number" value={form.fat} onChange={e => setForm({ ...form, fat: e.target.value })} /></div>
              </div>
              <div><Label>Data</Label><Input type="date" value={form.consumed_on} onChange={e => setForm({ ...form, consumed_on: e.target.value })} /></div>
            </div>
            <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={create}>Salvar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="surface-elevated p-6">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Resumo de hoje</div>
        <div className="grid grid-cols-4 gap-4">
          <div><div className="text-3xl font-display font-bold text-gradient">{totals.cal}</div><div className="text-xs text-muted-foreground mt-0.5">kcal</div></div>
          <div><div className="text-2xl font-display font-bold">{totals.p}g</div><div className="text-xs text-muted-foreground mt-0.5">proteína</div></div>
          <div><div className="text-2xl font-display font-bold">{totals.c}g</div><div className="text-xs text-muted-foreground mt-0.5">carbs</div></div>
          <div><div className="text-2xl font-display font-bold">{totals.f}g</div><div className="text-xs text-muted-foreground mt-0.5">gordura</div></div>
        </div>
      </div>

      <div className="space-y-5">
        {Object.keys(groupedByDate).length === 0 ? (
          <div className="surface-card p-12 text-center"><Apple className="size-10 mx-auto text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">Nenhuma refeição registrada.</p></div>
        ) : Object.entries(groupedByDate).map(([d, list]) => (
          <div key={d}>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              {d === today ? "Hoje" : format(new Date(d), "EEEE, d MMM", { locale: ptBR })}
            </div>
            <div className="space-y-2">
              {list.map(m => (
                <div key={m.id} className="surface-card p-4 flex items-center gap-3 group">
                  <div className="size-10 rounded-lg grid place-items-center bg-success/10 text-success"><Apple className="size-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground">{m.meal_type}</div>
                    <div className="font-medium truncate">{m.description}</div>
                  </div>
                  <div className="text-right text-xs">
                    {m.calories != null && <div className="font-mono text-primary">{m.calories} kcal</div>}
                    <div className="text-muted-foreground">P{m.protein ?? 0} C{m.carbs ?? 0} G{m.fat ?? 0}</div>
                  </div>
                  <button onClick={() => remove(m.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
