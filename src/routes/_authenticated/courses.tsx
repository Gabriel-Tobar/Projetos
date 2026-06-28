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
import { Plus, GraduationCap, Trash2, ExternalLink, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/courses")({
  head: () => ({ meta: [{ title: "Cursos — Tobar OS" }] }),
  component: CoursesPage,
});

const STATUS = [
  { v: "wishlist", l: "Quero fazer", c: "bg-muted text-muted-foreground" },
  { v: "in_progress", l: "Em andamento", c: "bg-primary/15 text-primary" },
  { v: "completed", l: "Concluído", c: "bg-success/15 text-success" },
];

function CoursesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", platform: "", instructor: "", url: "", status: "in_progress", notes: "" });

  const { data: courses } = useQuery({
    queryKey: ["courses", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("courses").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const create = async () => {
    if (!form.title.trim() || !user) return;
    const { error } = await supabase.from("courses").insert({
      user_id: user.id, title: form.title, platform: form.platform || null,
      instructor: form.instructor || null, url: form.url || null,
      status: form.status, notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    setForm({ title: "", platform: "", instructor: "", url: "", status: "in_progress", notes: "" });
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["courses"] });
  };

  const updateProgress = async (id: string, progress: number) => {
    await supabase.from("courses").update({ progress, status: progress >= 100 ? "completed" : "in_progress" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["courses"] });
  };
  const rate = async (id: string, rating: number) => { await supabase.from("courses").update({ rating }).eq("id", id); qc.invalidateQueries({ queryKey: ["courses"] }); };
  const remove = async (id: string) => { await supabase.from("courses").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["courses"] }); };

  const inProgress = (courses ?? []).filter(c => c.status === "in_progress").length;
  const completed = (courses ?? []).filter(c => c.status === "completed").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cursos</h1>
          <p className="text-sm text-muted-foreground mt-1">Sua biblioteca de aprendizado.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1" /> Novo curso</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo curso</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Título</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Plataforma</Label><Input value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} placeholder="Hotmart, Udemy…" /></div>
                <div><Label>Instrutor</Label><Input value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })} /></div>
              </div>
              <div><Label>URL</Label><Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} /></div>
              <div>
                <Label>Status</Label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full h-9 rounded-md bg-input border border-border px-3 text-sm">
                  {STATUS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                </select>
              </div>
              <div><Label>Notas</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={create}>Adicionar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="surface-elevated p-5"><div className="text-xs text-muted-foreground">Em andamento</div><div className="text-2xl font-display font-bold mt-1 text-gradient">{inProgress}</div></div>
        <div className="surface-elevated p-5"><div className="text-xs text-muted-foreground">Concluídos</div><div className="text-2xl font-display font-bold mt-1 text-success">{completed}</div></div>
        <div className="surface-elevated p-5"><div className="text-xs text-muted-foreground">Total</div><div className="text-2xl font-display font-bold mt-1">{(courses ?? []).length}</div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(courses ?? []).length === 0 ? (
          <div className="md:col-span-2 surface-card p-12 text-center"><GraduationCap className="size-10 mx-auto text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">Nenhum curso ainda.</p></div>
        ) : (courses ?? []).map(c => {
          const st = STATUS.find(s => s.v === c.status) ?? STATUS[0];
          return (
            <div key={c.id} className="surface-card p-5 group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${st.c}`}>{st.l}</span>
                  <h3 className="font-display font-semibold mt-1.5">{c.title}</h3>
                  <div className="text-xs text-muted-foreground mt-0.5">{[c.platform, c.instructor].filter(Boolean).join(" • ")}</div>
                </div>
                <div className="flex items-center gap-1">
                  {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><ExternalLink className="size-4" /></a>}
                  <button onClick={() => remove(c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1"><span className="text-muted-foreground">Progresso</span><span className="font-mono">{c.progress}%</span></div>
                <input type="range" min={0} max={100} step={5} value={c.progress} onChange={e => updateProgress(c.id, Number(e.target.value))} className="w-full accent-primary" />
                <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full" style={{ width: `${c.progress}%`, background: "var(--gradient-primary)" }} /></div>
              </div>
              <div className="mt-3 flex items-center gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => rate(c.id, n)} className={(c.rating ?? 0) >= n ? "text-warning" : "text-muted-foreground/40 hover:text-warning"}>
                    <Star className={`size-4 ${(c.rating ?? 0) >= n ? "fill-current" : ""}`} />
                  </button>
                ))}
              </div>
              {c.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{c.notes}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
