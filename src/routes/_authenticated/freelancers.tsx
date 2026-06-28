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
import { Plus, Users, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/freelancers")({
  head: () => ({ meta: [{ title: "Freelancers — Tobar OS" }] }),
  component: FreelancersPage,
});

function FreelancersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", specialty: "", email: "", phone: "", rate: "", rating: "5", notes: "" });

  const { data: freelancers } = useQuery({
    queryKey: ["freelancers", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("freelancers").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const create = async () => {
    if (!form.name.trim() || !user) return;
    const { error } = await supabase.from("freelancers").insert({
      user_id: user.id, name: form.name, specialty: form.specialty || null,
      email: form.email || null, phone: form.phone || null,
      rate: form.rate ? Number(form.rate) : null,
      rating: form.rating ? Number(form.rating) : null,
      notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    setForm({ name: "", specialty: "", email: "", phone: "", rate: "", rating: "5", notes: "" });
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["freelancers"] });
    toast.success("Freelancer adicionado");
  };

  const remove = async (id: string) => { await supabase.from("freelancers").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["freelancers"] }); };
  const toggleStatus = async (id: string, status: string) => {
    await supabase.from("freelancers").update({ status: status === "active" ? "inactive" : "active" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["freelancers"] });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Freelancers</h1>
          <p className="text-sm text-muted-foreground mt-1">Sua rede de talentos.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1" /> Novo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo freelancer</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus /></div>
              <div><Label>Especialidade</Label><Input value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} placeholder="Designer, Dev, Tráfego…" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>E-mail</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor/h (R$)</Label><Input type="number" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} /></div>
                <div><Label>Rating (1-5)</Label><Input type="number" min={1} max={5} value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} /></div>
              </div>
              <div><Label>Notas</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={create}>Adicionar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(freelancers ?? []).length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 surface-card p-12 text-center"><Users className="size-10 mx-auto text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">Nenhum freelancer cadastrado.</p></div>
        ) : (freelancers ?? []).map(f => (
          <div key={f.id} className="surface-card p-5 group">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-11 rounded-xl grid place-items-center text-sm font-bold text-primary-foreground shrink-0" style={{ background: "var(--gradient-primary)" }}>
                  {f.name.slice(0,2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{f.name}</div>
                  {f.specialty && <div className="text-xs text-muted-foreground truncate">{f.specialty}</div>}
                </div>
              </div>
              <button onClick={() => remove(f.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
            </div>
            <div className="mt-3 flex items-center gap-1 text-warning">
              {Array.from({ length: f.rating ?? 0 }).map((_, i) => <Star key={i} className="size-3.5 fill-current" />)}
            </div>
            <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
              {f.email && <div>{f.email}</div>}
              {f.phone && <div>{f.phone}</div>}
              {f.rate != null && <div className="text-primary font-mono">R$ {Number(f.rate).toFixed(2)}/h</div>}
            </div>
            {f.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{f.notes}</p>}
            <button onClick={() => toggleStatus(f.id, f.status)} className={`mt-3 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${f.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
              {f.status === "active" ? "Ativo" : "Inativo"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
