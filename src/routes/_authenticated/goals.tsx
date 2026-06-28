import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Target, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({ meta: [{ title: "Metas — Tobar OS" }] }),
  component: GoalsPage,
});

function GoalsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [target, setTarget] = useState("");
  const [category, setCategory] = useState("monthly");

  const { data: goals } = useQuery({
    queryKey: ["goals", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("goals").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const create = async () => {
    if (!title.trim() || !user) return;
    const { error } = await supabase.from("goals").insert({
      user_id: user.id, title, description: desc || null, category,
      target_date: target || null,
    });
    if (error) return toast.error(error.message);
    setTitle(""); setDesc(""); setTarget(""); setCategory("monthly"); setOpen(false);
    qc.invalidateQueries({ queryKey: ["goals"] });
  };

  const updateProgress = async (id: string, progress: number) => {
    await supabase.from("goals").update({ progress, status: progress >= 100 ? "completed" : "active" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["goals"] });
  };

  const remove = async (id: string) => {
    await supabase.from("goals").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["goals"] });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Metas</h1>
          <p className="text-sm text-muted-foreground mt-1">Defina objetivos. Acompanhe o progresso.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1" /> Nova meta</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova meta</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Título</Label><Input value={title} onChange={e => setTitle(e.target.value)} autoFocus /></div>
              <div><Label>Descrição</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full h-9 rounded-md bg-input border border-border px-3 text-sm">
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="annual">Anual</option>
                    <option value="custom">Personalizada</option>
                  </select>
                </div>
                <div><Label>Prazo</Label><Input type="date" value={target} onChange={e => setTarget(e.target.value)} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={create}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(goals ?? []).length === 0 ? (
          <div className="md:col-span-2 surface-card p-12 text-center">
            <Target className="size-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma meta criada ainda.</p>
          </div>
        ) : (goals ?? []).map(g => (
          <div key={g.id} className="surface-card p-5 group">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-primary px-1.5 py-0.5 rounded bg-primary/10">{g.category}</span>
                  {g.status === "completed" && <span className="text-[10px] uppercase tracking-wider text-success">concluída</span>}
                </div>
                <h3 className="font-display font-semibold">{g.title}</h3>
                {g.description && <p className="text-sm text-muted-foreground mt-1">{g.description}</p>}
                {g.target_date && <p className="text-xs text-muted-foreground mt-2">Prazo: {format(new Date(g.target_date), "d MMM yyyy", { locale: ptBR })}</p>}
              </div>
              <button onClick={() => remove(g.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-mono">{g.progress}%</span>
              </div>
              <input
                type="range" min={0} max={100} step={5}
                value={g.progress}
                onChange={e => updateProgress(g.id, Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="h-2 rounded-full bg-muted overflow-hidden mt-2">
                <div className="h-full transition-all duration-500" style={{ width: `${g.progress}%`, background: "var(--gradient-primary)" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
