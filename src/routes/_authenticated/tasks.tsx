import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { awardXp } from "@/lib/gamification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Clock, Loader2, CheckSquare, Square } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "Tarefas — Tobar OS" }] }),
  component: TasksPage,
});

type Task = {
  id: string; title: string; description: string | null; status: string;
  priority: string; due_date: string | null; tags: string[] | null; category: string | null;
};

const COLUMNS: { key: string; label: string }[] = [
  { key: "todo", label: "A fazer" },
  { key: "in_progress", label: "Em andamento" },
  { key: "done", label: "Concluído" },
];

function TasksPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return (data ?? []) as Task[];
    },
  });

  const create = async () => {
    if (!title.trim() || !user) return;
    const { error } = await supabase.from("tasks").insert({
      user_id: user.id, title, description: description || null, priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    });
    if (error) return toast.error(error.message);
    toast.success("Tarefa criada");
    setTitle(""); setDescription(""); setPriority("medium"); setDueDate(""); setOpen(false);
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["dashboard-tasks"] });
  };

  const toggleStatus = async (t: Task) => {
    const newStatus = t.status === "done" ? "todo" : "done";
    const { error } = await supabase.from("tasks").update({
      status: newStatus,
      completed_at: newStatus === "done" ? new Date().toISOString() : null,
    }).eq("id", t.id);
    if (error) return toast.error(error.message);
    if (newStatus === "done" && user) {
      await awardXp(user.id, 10, "task");
      toast.success("✓ +10 XP");
      qc.invalidateQueries({ queryKey: ["user_stats"] });
    }
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["dashboard-tasks"] });
  };

  const moveTo = async (t: Task, status: string) => {
    await supabase.from("tasks").update({ status }).eq("id", t.id);
    qc.invalidateQueries({ queryKey: ["tasks"] });
  };

  const remove = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["dashboard-tasks"] });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tarefas</h1>
          <p className="text-sm text-muted-foreground mt-1">Kanban pessoal. Conclua para ganhar XP.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4 mr-1" /> Nova tarefa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova tarefa</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Título</Label><Input value={title} onChange={e => setTitle(e.target.value)} autoFocus /></div>
              <div><Label>Descrição</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Prioridade</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Prazo</Label><Input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={create}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => {
            const items = (tasks ?? []).filter(t => t.status === col.key);
            return (
              <div key={col.key} className="surface-card p-4 min-h-[300px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-sm">{col.label}</h3>
                  <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map(t => (
                    <div key={t.id} className="rounded-lg border border-border bg-muted/30 p-3 group">
                      <div className="flex items-start gap-2">
                        <button onClick={() => toggleStatus(t)} className="mt-0.5 text-muted-foreground hover:text-primary transition-colors">
                          {t.status === "done" ? <CheckSquare className="size-4 text-success" /> : <Square className="size-4" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                          {t.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>}
                          <div className="flex items-center gap-2 mt-2">
                            <PriorityBadge p={t.priority} />
                            {t.due_date && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="size-3" /> {format(new Date(t.due_date), "d MMM HH:mm", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                      {/* move buttons */}
                      <div className="flex gap-1 mt-2">
                        {COLUMNS.filter(c => c.key !== t.status).map(c => (
                          <button key={c.key} onClick={() => moveTo(t, c.key)} className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-primary/15 hover:text-primary transition-colors">
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Vazio</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PriorityBadge({ p }: { p: string }) {
  const map: Record<string, { c: string; l: string }> = {
    urgent: { c: "bg-destructive/15 text-destructive", l: "Urgente" },
    high: { c: "bg-warning/15 text-warning", l: "Alta" },
    medium: { c: "bg-primary/15 text-primary", l: "Média" },
    low: { c: "bg-muted text-muted-foreground", l: "Baixa" },
  };
  const v = map[p] ?? map.medium;
  return <span className={`text-[10px] px-1.5 py-0.5 rounded ${v.c}`}>{v.l}</span>;
}
