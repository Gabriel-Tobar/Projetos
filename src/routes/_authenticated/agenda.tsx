import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({ meta: [{ title: "Agenda — Tobar OS" }] }),
  component: AgendaPage,
});

function AgendaPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [cursor]);

  const { data: events } = useQuery({
    queryKey: ["events", user?.id, gridStart.toISOString(), gridEnd.toISOString()],
    enabled: !!user,
    queryFn: async () => (await supabase.from("events").select("*").eq("user_id", user!.id)
      .gte("starts_at", gridStart.toISOString())
      .lte("starts_at", gridEnd.toISOString())).data ?? [],
  });

  const eventsByDay = useMemo(() => {
    const map = new Map<string, typeof events>();
    (events ?? []).forEach(e => {
      const k = format(new Date(e.starts_at), "yyyy-MM-dd");
      if (!map.has(k)) map.set(k, [] as any);
      (map.get(k) as any).push(e);
    });
    return map;
  }, [events]);

  const dayEvents = (events ?? []).filter(e => isSameDay(new Date(e.starts_at), selected));

  const create = async () => {
    if (!title.trim() || !start || !user) return;
    const { error } = await supabase.from("events").insert({
      user_id: user.id, title, description: desc || null,
      starts_at: new Date(start).toISOString(),
      ends_at: end ? new Date(end).toISOString() : null,
    });
    if (error) return toast.error(error.message);
    toast.success("Evento adicionado");
    setTitle(""); setDesc(""); setStart(""); setEnd(""); setOpen(false);
    qc.invalidateQueries({ queryKey: ["events"] });
    qc.invalidateQueries({ queryKey: ["dashboard-events"] });
  };

  const remove = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["events"] });
    qc.invalidateQueries({ queryKey: ["dashboard-events"] });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground mt-1">Calendário completo dos seus compromissos.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1" /> Novo evento</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo evento</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Título</Label><Input value={title} onChange={e => setTitle(e.target.value)} autoFocus /></div>
              <div><Label>Descrição</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Início</Label><Input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} /></div>
                <div><Label>Fim</Label><Input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={create}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold capitalize">{format(cursor, "MMMM 'de' yyyy", { locale: ptBR })}</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setCursor(addMonths(cursor, -1))}><ChevronLeft className="size-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => { setCursor(new Date()); setSelected(new Date()); }}>Hoje</Button>
              <Button variant="ghost" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="size-4" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d => (
              <div key={d} className="text-[10px] text-center uppercase tracking-wider text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map(d => {
              const k = format(d, "yyyy-MM-dd");
              const has = eventsByDay.get(k);
              const inMonth = isSameMonth(d, cursor);
              const isSel = isSameDay(d, selected);
              const isToday = isSameDay(d, new Date());
              return (
                <button
                  key={k}
                  onClick={() => setSelected(d)}
                  className={`aspect-square rounded-lg p-1.5 text-left transition-all border ${
                    isSel ? "border-primary bg-primary/10" :
                    isToday ? "border-primary/40" : "border-transparent hover:bg-muted/50"
                  } ${!inMonth ? "opacity-30" : ""}`}
                >
                  <div className={`text-xs ${isToday ? "font-bold text-primary" : ""}`}>{format(d, "d")}</div>
                  {has && (
                    <div className="flex gap-0.5 mt-1">
                      {(has as any[]).slice(0,3).map((_, i) => <div key={i} className="size-1 rounded-full bg-primary" />)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="surface-card p-5">
          <h3 className="font-display font-semibold mb-3">
            {format(selected, "d 'de' MMMM", { locale: ptBR })}
          </h3>
          {dayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum evento neste dia.</p>
          ) : (
            <ul className="space-y-2">
              {dayEvents.map(e => (
                <li key={e.id} className="p-3 rounded-lg bg-muted/40 border border-border group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{e.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(e.starts_at), "HH:mm")}
                        {e.ends_at && ` — ${format(new Date(e.ends_at), "HH:mm")}`}
                      </div>
                      {e.description && <p className="text-xs text-muted-foreground mt-1">{e.description}</p>}
                    </div>
                    <button onClick={() => remove(e.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
