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
import { Plus, BookOpen, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/studies")({
  head: () => ({ meta: [{ title: "Estudos — Tobar OS" }] }),
  component: StudiesPage,
});

function StudiesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", topic: "", minutes: "30", notes: "", studied_on: new Date().toISOString().slice(0,10) });

  const { data: sessions } = useQuery({
    queryKey: ["studies", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("study_sessions").select("*").eq("user_id", user!.id).order("studied_on", { ascending: false }).limit(100)).data ?? [],
  });

  const create = async () => {
    if (!form.subject.trim() || !user) return;
    const { error } = await supabase.from("study_sessions").insert({
      user_id: user.id, subject: form.subject, topic: form.topic || null,
      minutes: Number(form.minutes) || 0, notes: form.notes || null, studied_on: form.studied_on,
    });
    if (error) return toast.error(error.message);
    setForm({ subject: "", topic: "", minutes: "30", notes: "", studied_on: new Date().toISOString().slice(0,10) });
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["studies"] });
    toast.success("Sessão registrada");
  };

  const remove = async (id: string) => { await supabase.from("study_sessions").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["studies"] }); };

  const { totalMin, weekMin, bySubject } = useMemo(() => {
    const all = sessions ?? [];
    const weekAgo = new Date(Date.now() - 7*86400000).toISOString().slice(0,10);
    const totalMin = all.reduce((s, x) => s + (x.minutes ?? 0), 0);
    const weekMin = all.filter(x => x.studied_on >= weekAgo).reduce((s, x) => s + (x.minutes ?? 0), 0);
    const bySubject: Record<string, number> = {};
    all.forEach(x => { bySubject[x.subject] = (bySubject[x.subject] ?? 0) + (x.minutes ?? 0); });
    return { totalMin, weekMin, bySubject };
  }, [sessions]);

  const topSubjects = Object.entries(bySubject).sort((a,b) => b[1] - a[1]).slice(0, 5);
  const max = topSubjects[0]?.[1] ?? 1;
  const fmt = (m: number) => `${Math.floor(m/60)}h ${m%60}min`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estudos</h1>
          <p className="text-sm text-muted-foreground mt-1">Sessões, matérias e tempo dedicado.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1" /> Nova sessão</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova sessão de estudo</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Matéria</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Marketing, Inglês, Programação…" autoFocus /></div>
              <div><Label>Tópico</Label><Input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Minutos</Label><Input type="number" value={form.minutes} onChange={e => setForm({ ...form, minutes: e.target.value })} /></div>
                <div><Label>Data</Label><Input type="date" value={form.studied_on} onChange={e => setForm({ ...form, studied_on: e.target.value })} /></div>
              </div>
              <div><Label>Anotações</Label><Textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={create}>Salvar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="surface-elevated p-5"><div className="text-xs text-muted-foreground">Total</div><div className="text-2xl font-display font-bold mt-1 text-gradient">{fmt(totalMin)}</div></div>
        <div className="surface-elevated p-5"><div className="text-xs text-muted-foreground">Últimos 7 dias</div><div className="text-2xl font-display font-bold mt-1">{fmt(weekMin)}</div></div>
        <div className="surface-elevated p-5"><div className="text-xs text-muted-foreground">Sessões</div><div className="text-2xl font-display font-bold mt-1">{(sessions ?? []).length}</div></div>
      </div>

      {topSubjects.length > 0 && (
        <div className="surface-card p-5">
          <h2 className="font-display font-semibold mb-3">Tempo por matéria</h2>
          <div className="space-y-2.5">
            {topSubjects.map(([s, m]) => (
              <div key={s}>
                <div className="flex items-center justify-between text-xs mb-1"><span>{s}</span><span className="font-mono text-muted-foreground">{fmt(m)}</span></div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full" style={{ width: `${(m/max)*100}%`, background: "var(--gradient-primary)" }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {(sessions ?? []).length === 0 ? (
          <div className="surface-card p-12 text-center"><BookOpen className="size-10 mx-auto text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">Nenhuma sessão ainda.</p></div>
        ) : (sessions ?? []).map(s => (
          <div key={s.id} className="surface-card p-4 flex items-start gap-3 group">
            <div className="size-10 rounded-lg grid place-items-center bg-primary/10 text-primary"><Clock className="size-4" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2"><span className="font-medium">{s.subject}</span>{s.topic && <span className="text-xs text-muted-foreground">• {s.topic}</span>}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{format(new Date(s.studied_on), "d MMM yyyy", { locale: ptBR })} • {fmt(s.minutes)}</div>
              {s.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.notes}</p>}
            </div>
            <button onClick={() => remove(s.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
