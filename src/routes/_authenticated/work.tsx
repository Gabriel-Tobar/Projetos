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
import { Plus, Briefcase, Trash2, Users2, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/work")({
  head: () => ({ meta: [{ title: "Elo Marketing — Tobar OS" }] }),
  component: WorkPage,
});

const STATUSES = [
  { v: "in_progress", l: "Em andamento", c: "text-primary bg-primary/10" },
  { v: "review", l: "Em revisão", c: "text-warning bg-warning/10" },
  { v: "done", l: "Concluído", c: "text-success bg-success/10" },
  { v: "on_hold", l: "Pausado", c: "text-muted-foreground bg-muted" },
];

function WorkPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"projects" | "clients">("projects");
  const [openClient, setOpenClient] = useState(false);
  const [openProject, setOpenProject] = useState(false);

  const [cName, setCName] = useState(""); const [cCompany, setCCompany] = useState(""); const [cEmail, setCEmail] = useState(""); const [cPhone, setCPhone] = useState("");
  const [pTitle, setPTitle] = useState(""); const [pDesc, setPDesc] = useState(""); const [pClient, setPClient] = useState<string>(""); const [pValue, setPValue] = useState(""); const [pDeadline, setPDeadline] = useState("");

  const { data: clients } = useQuery({
    queryKey: ["clients", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("clients").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: projects } = useQuery({
    queryKey: ["projects", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("projects").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const createClient = async () => {
    if (!cName.trim() || !user) return;
    const { error } = await supabase.from("clients").insert({ user_id: user.id, name: cName, company: cCompany || null, email: cEmail || null, phone: cPhone || null });
    if (error) return toast.error(error.message);
    setCName(""); setCCompany(""); setCEmail(""); setCPhone(""); setOpenClient(false);
    qc.invalidateQueries({ queryKey: ["clients"] });
    toast.success("Cliente criado");
  };
  const createProject = async () => {
    if (!pTitle.trim() || !user) return;
    const { error } = await supabase.from("projects").insert({
      user_id: user.id, title: pTitle, description: pDesc || null,
      client_id: pClient || null, value: pValue ? Number(pValue) : 0, deadline: pDeadline || null,
    });
    if (error) return toast.error(error.message);
    setPTitle(""); setPDesc(""); setPClient(""); setPValue(""); setPDeadline(""); setOpenProject(false);
    qc.invalidateQueries({ queryKey: ["projects"] });
    toast.success("Projeto criado");
  };

  const updateProjectStatus = async (id: string, status: string) => {
    await supabase.from("projects").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["projects"] });
  };
  const updateProjectProgress = async (id: string, progress: number) => {
    await supabase.from("projects").update({ progress, status: progress >= 100 ? "done" : undefined }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["projects"] });
  };
  const removeProject = async (id: string) => { await supabase.from("projects").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["projects"] }); };
  const removeClient = async (id: string) => { await supabase.from("clients").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["clients"] }); qc.invalidateQueries({ queryKey: ["projects"] }); };

  const totalValue = (projects ?? []).reduce((s, p) => s + Number(p.value ?? 0), 0);
  const activeCount = (projects ?? []).filter(p => p.status === "in_progress").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Elo Marketing</h1>
          <p className="text-sm text-muted-foreground mt-1">Clientes, projetos, pipeline.</p>
        </div>
        {tab === "projects" ? (
          <Dialog open={openProject} onOpenChange={setOpenProject}>
            <DialogTrigger asChild><Button><Plus className="size-4 mr-1" /> Novo projeto</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo projeto</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Título</Label><Input value={pTitle} onChange={e => setPTitle(e.target.value)} autoFocus /></div>
                <div><Label>Descrição</Label><Textarea value={pDesc} onChange={e => setPDesc(e.target.value)} rows={2} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Cliente</Label>
                    <select value={pClient} onChange={e => setPClient(e.target.value)} className="w-full h-9 rounded-md bg-input border border-border px-3 text-sm">
                      <option value="">Nenhum</option>
                      {(clients ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div><Label>Valor (R$)</Label><Input type="number" value={pValue} onChange={e => setPValue(e.target.value)} /></div>
                </div>
                <div><Label>Prazo</Label><Input type="date" value={pDeadline} onChange={e => setPDeadline(e.target.value)} /></div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setOpenProject(false)}>Cancelar</Button><Button onClick={createProject}>Criar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Dialog open={openClient} onOpenChange={setOpenClient}>
            <DialogTrigger asChild><Button><Plus className="size-4 mr-1" /> Novo cliente</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo cliente</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome</Label><Input value={cName} onChange={e => setCName(e.target.value)} autoFocus /></div>
                <div><Label>Empresa</Label><Input value={cCompany} onChange={e => setCCompany(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>E-mail</Label><Input value={cEmail} onChange={e => setCEmail(e.target.value)} /></div>
                  <div><Label>Telefone</Label><Input value={cPhone} onChange={e => setCPhone(e.target.value)} /></div>
                </div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setOpenClient(false)}>Cancelar</Button><Button onClick={createClient}>Criar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="surface-card p-4"><div className="text-xs text-muted-foreground">Projetos ativos</div><div className="text-2xl font-display font-bold mt-1">{activeCount}</div></div>
        <div className="surface-card p-4"><div className="text-xs text-muted-foreground">Clientes</div><div className="text-2xl font-display font-bold mt-1">{(clients ?? []).length}</div></div>
        <div className="surface-card p-4"><div className="text-xs text-muted-foreground">Pipeline (R$)</div><div className="text-2xl font-display font-bold mt-1 text-gradient">{totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div></div>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <button onClick={() => setTab("projects")} className={`px-3 py-1.5 rounded text-sm transition ${tab === "projects" ? "bg-card text-foreground" : "text-muted-foreground"}`}><FolderKanban className="size-3.5 inline mr-1" /> Projetos</button>
        <button onClick={() => setTab("clients")} className={`px-3 py-1.5 rounded text-sm transition ${tab === "clients" ? "bg-card text-foreground" : "text-muted-foreground"}`}><Users2 className="size-3.5 inline mr-1" /> Clientes</button>
      </div>

      {tab === "projects" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(projects ?? []).length === 0 ? (
            <div className="md:col-span-2 surface-card p-12 text-center"><Briefcase className="size-10 mx-auto text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">Nenhum projeto ainda.</p></div>
          ) : (projects ?? []).map(p => {
            const client = clients?.find(c => c.id === p.client_id);
            const st = STATUSES.find(s => s.v === p.status) ?? STATUSES[0];
            return (
              <div key={p.id} className="surface-card p-5 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${st.c}`}>{st.l}</span>
                    <h3 className="font-display font-semibold mt-1.5">{p.title}</h3>
                    {client && <p className="text-xs text-muted-foreground mt-0.5">{client.name}</p>}
                    {p.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.description}</p>}
                  </div>
                  <button onClick={() => removeProject(p.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"><Trash2 className="size-4" /></button>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-mono text-primary">R$ {Number(p.value ?? 0).toLocaleString("pt-BR")}</span>
                  {p.deadline && <span className="text-muted-foreground">{format(new Date(p.deadline), "d MMM", { locale: ptBR })}</span>}
                </div>
                <div className="mt-3">
                  <input type="range" min={0} max={100} step={5} value={p.progress} onChange={e => updateProjectProgress(p.id, Number(e.target.value))} className="w-full accent-primary" />
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1"><div className="h-full" style={{ width: `${p.progress}%`, background: "var(--gradient-primary)" }} /></div>
                </div>
                <select value={p.status} onChange={e => updateProjectStatus(p.id, e.target.value)} className="mt-3 w-full h-8 rounded-md bg-input border border-border px-2 text-xs">
                  {STATUSES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(clients ?? []).length === 0 ? (
            <div className="md:col-span-2 surface-card p-12 text-center"><Users2 className="size-10 mx-auto text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">Nenhum cliente ainda.</p></div>
          ) : (clients ?? []).map(c => (
            <div key={c.id} className="surface-card p-5 group flex items-start gap-3">
              <div className="size-10 rounded-lg grid place-items-center text-sm font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                {c.name.slice(0,2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{c.name}</div>
                {c.company && <div className="text-xs text-muted-foreground">{c.company}</div>}
                <div className="text-xs text-muted-foreground mt-1">{[c.email, c.phone].filter(Boolean).join(" • ")}</div>
              </div>
              <button onClick={() => removeClient(c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
