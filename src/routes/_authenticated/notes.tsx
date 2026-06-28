import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Star, Pin, Trash2, NotebookPen } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => ({ meta: [{ title: "Anotações — Tobar OS" }] }),
  component: NotesPage,
});

type Note = { id: string; title: string; content: string | null; favorite: boolean; pinned: boolean; updated_at: string };

function NotesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const { data: notes } = useQuery({
    queryKey: ["notes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("notes").select("*").eq("user_id", user!.id).order("pinned", { ascending: false }).order("updated_at", { ascending: false });
      return (data ?? []) as Note[];
    },
  });

  const filtered = (notes ?? []).filter(n =>
    !query || n.title.toLowerCase().includes(query.toLowerCase()) || (n.content ?? "").toLowerCase().includes(query.toLowerCase()));
  const active = filtered.find(n => n.id === activeId) ?? filtered[0];

  useEffect(() => {
    if (filtered.length && !filtered.find(n => n.id === activeId)) setActiveId(filtered[0].id);
  }, [filtered.length]);

  const create = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("notes").insert({ user_id: user.id, title: "Nova anotação" }).select().single();
    if (error) return toast.error(error.message);
    setActiveId(data.id);
    qc.invalidateQueries({ queryKey: ["notes"] });
  };

  const update = async (id: string, patch: Partial<Note>) => {
    await supabase.from("notes").update(patch).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notes"] });
  };

  const remove = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["notes"] });
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-9rem)]">
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 h-full">
        {/* List */}
        <div className="surface-card p-3 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <Input placeholder="Buscar…" value={query} onChange={e => setQuery(e.target.value)} className="h-8 text-sm" />
            <Button size="icon" variant="default" onClick={create} className="size-8 shrink-0"><Plus className="size-4" /></Button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Sem anotações</p>}
            {filtered.map(n => (
              <button
                key={n.id}
                onClick={() => setActiveId(n.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${active?.id === n.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50 border border-transparent"}`}
              >
                <div className="flex items-center gap-1.5">
                  {n.pinned && <Pin className="size-3 text-primary" />}
                  {n.favorite && <Star className="size-3 text-warning" />}
                  <span className="text-sm font-medium truncate">{n.title}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{n.content ?? "Sem conteúdo"}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(n.updated_at), "d MMM HH:mm")}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="surface-card p-5 flex flex-col overflow-hidden">
          {active ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Input
                  value={active.title}
                  onChange={e => update(active.id, { title: e.target.value })}
                  className="text-lg font-display font-semibold border-transparent bg-transparent focus-visible:bg-muted/50"
                />
                <Button variant="ghost" size="icon" onClick={() => update(active.id, { pinned: !active.pinned })}>
                  <Pin className={`size-4 ${active.pinned ? "text-primary" : "text-muted-foreground"}`} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => update(active.id, { favorite: !active.favorite })}>
                  <Star className={`size-4 ${active.favorite ? "text-warning" : "text-muted-foreground"}`} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(active.id)}>
                  <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
              <Textarea
                value={active.content ?? ""}
                onChange={e => update(active.id, { content: e.target.value })}
                placeholder="Comece a escrever…"
                className="flex-1 resize-none border-transparent bg-transparent focus-visible:bg-muted/30 leading-relaxed"
              />
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-muted-foreground">
              <div className="text-center">
                <NotebookPen className="size-10 mx-auto mb-3" />
                <p className="text-sm">Selecione ou crie uma anotação.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
