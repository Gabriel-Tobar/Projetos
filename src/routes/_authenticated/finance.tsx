import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Wallet, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({ meta: [{ title: "Financeiro — Tobar OS" }] }),
  component: FinancePage,
});

function FinancePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));

  const { data: tx } = useQuery({
    queryKey: ["transactions", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("transactions").select("*").eq("user_id", user!.id).order("occurred_on", { ascending: false }).limit(200)).data ?? [],
  });

  const create = async () => {
    if (!amount || !user) return;
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id, kind, amount: Number(amount),
      category: category || null, description: description || null, occurred_on: date,
    });
    if (error) return toast.error(error.message);
    setAmount(""); setCategory(""); setDescription(""); setOpen(false);
    qc.invalidateQueries({ queryKey: ["transactions"] });
    toast.success("Registrado");
  };

  const remove = async (id: string) => { await supabase.from("transactions").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["transactions"] }); };

  const { income, expense, balance, byCategory } = useMemo(() => {
    const items = tx ?? [];
    const month = new Date().toISOString().slice(0,7);
    const inMonth = items.filter(i => i.occurred_on.startsWith(month));
    const income = inMonth.filter(i => i.kind === "income").reduce((s, i) => s + Number(i.amount), 0);
    const expense = inMonth.filter(i => i.kind === "expense").reduce((s, i) => s + Number(i.amount), 0);
    const byCategory: Record<string, number> = {};
    inMonth.filter(i => i.kind === "expense").forEach(i => {
      const k = i.category || "Outros";
      byCategory[k] = (byCategory[k] ?? 0) + Number(i.amount);
    });
    return { income, expense, balance: income - expense, byCategory };
  }, [tx]);

  const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const topCats = Object.entries(byCategory).sort((a,b) => b[1] - a[1]).slice(0, 5);
  const maxCat = topCats[0]?.[1] ?? 1;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">Resumo do mês • {format(new Date(), "MMMM yyyy", { locale: ptBR })}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1" /> Lançamento</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo lançamento</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setKind("income")} className={`flex-1 py-2 rounded-lg text-sm transition ${kind === "income" ? "bg-success/15 text-success border border-success/30" : "bg-muted text-muted-foreground"}`}>Entrada</button>
                <button onClick={() => setKind("expense")} className={`flex-1 py-2 rounded-lg text-sm transition ${kind === "expense" ? "bg-destructive/15 text-destructive border border-destructive/30" : "bg-muted text-muted-foreground"}`}>Saída</button>
              </div>
              <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} autoFocus /></div>
              <div><Label>Categoria</Label><Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Salário, Aluguel, Marketing…" /></div>
              <div><Label>Descrição</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
              <div><Label>Data</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            </div>
            <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={create}>Salvar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="surface-elevated p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="size-3.5 text-success" /> Entradas</div>
          <div className="text-2xl font-display font-bold mt-1 text-success">{brl(income)}</div>
        </div>
        <div className="surface-elevated p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingDown className="size-3.5 text-destructive" /> Saídas</div>
          <div className="text-2xl font-display font-bold mt-1 text-destructive">{brl(expense)}</div>
        </div>
        <div className="surface-elevated p-5">
          <div className="text-xs text-muted-foreground">Saldo</div>
          <div className={`text-2xl font-display font-bold mt-1 ${balance >= 0 ? "text-gradient" : "text-destructive"}`}>{brl(balance)}</div>
        </div>
      </div>

      {topCats.length > 0 && (
        <div className="surface-card p-5">
          <h2 className="font-display font-semibold mb-3">Maiores categorias de despesa</h2>
          <div className="space-y-2.5">
            {topCats.map(([cat, val]) => (
              <div key={cat}>
                <div className="flex items-center justify-between text-xs mb-1"><span className="text-muted-foreground">{cat}</span><span className="font-mono">{brl(val)}</span></div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full" style={{ width: `${(val/maxCat)*100}%`, background: "var(--gradient-primary)" }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="surface-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border font-display font-semibold">Lançamentos recentes</div>
        {(tx ?? []).length === 0 ? (
          <div className="p-12 text-center"><Wallet className="size-10 mx-auto text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">Nenhum lançamento ainda.</p></div>
        ) : (
          <div className="divide-y divide-border">
            {(tx ?? []).slice(0, 50).map(t => (
              <div key={t.id} className="px-5 py-3 flex items-center gap-3 group hover:bg-muted/40">
                <div className={`size-8 rounded-lg grid place-items-center ${t.kind === "income" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                  {t.kind === "income" ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{t.description || t.category || (t.kind === "income" ? "Entrada" : "Saída")}</div>
                  <div className="text-xs text-muted-foreground">{t.category} • {format(new Date(t.occurred_on), "d MMM", { locale: ptBR })}</div>
                </div>
                <div className={`font-mono text-sm ${t.kind === "income" ? "text-success" : "text-destructive"}`}>{t.kind === "income" ? "+" : "-"}{brl(Number(t.amount))}</div>
                <button onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
