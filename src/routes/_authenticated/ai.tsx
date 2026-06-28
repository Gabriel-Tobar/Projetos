import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Loader2, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { chatWithAi } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/ai")({
  head: () => ({ meta: [{ title: "IA Assistant — Tobar OS" }] }),
  component: AiPage,
});

const PROMPTS = [
  "Crie um plano de ação para a semana baseado nas minhas metas.",
  "Me ajude a estruturar uma proposta comercial para um novo cliente.",
  "Sugira 5 hábitos para aumentar minha produtividade.",
  "Como posso melhorar a margem do meu negócio?",
];

function AiPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const chat = useServerFn(chatWithAi);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useQuery({
    queryKey: ["ai_messages", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("ai_messages").select("*").eq("user_id", user!.id).order("created_at")).data ?? [],
  });

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, sending]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || !user || sending) return;
    setInput(""); setSending(true);

    await supabase.from("ai_messages").insert({ user_id: user.id, role: "user", content });
    qc.invalidateQueries({ queryKey: ["ai_messages"] });

    try {
      const history = [...(messages ?? []), { role: "user", content }].slice(-12).map(m => ({ role: m.role as any, content: m.content }));
      const res = await chat({ data: { messages: history } });
      await supabase.from("ai_messages").insert({ user_id: user.id, role: "assistant", content: res.content });
      qc.invalidateQueries({ queryKey: ["ai_messages"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Falha na IA");
    } finally { setSending(false); }
  };

  const clear = async () => {
    if (!user || !confirm("Limpar todo o histórico?")) return;
    await supabase.from("ai_messages").delete().eq("user_id", user.id);
    qc.invalidateQueries({ queryKey: ["ai_messages"] });
  };

  const empty = (messages ?? []).length === 0;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl grid place-items-center text-primary-foreground" style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}>
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">IA Assistant</h1>
            <p className="text-xs text-muted-foreground">Seu copiloto estratégico</p>
          </div>
        </div>
        {!empty && <button onClick={clear} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"><Trash2 className="size-3.5" /> Limpar</button>}
      </div>

      <div ref={scrollRef} className="flex-1 surface-card p-4 overflow-y-auto space-y-4">
        {empty ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="size-16 rounded-2xl grid place-items-center mb-4" style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}>
              <Sparkles className="size-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-display font-semibold">Como posso ajudar?</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">Pergunte qualquer coisa sobre estratégia, planejamento, negócio ou produtividade.</p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {PROMPTS.map(p => (
                <button key={p} onClick={() => send(p)} className="text-left text-sm p-3 surface-card hover:border-primary/40 transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {(messages ?? []).map(m => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`size-8 rounded-lg grid place-items-center shrink-0 ${m.role === "user" ? "bg-muted" : "text-primary-foreground"}`} style={m.role === "assistant" ? { background: "var(--gradient-primary)" } : undefined}>
                  {m.role === "user" ? <User className="size-4" /> : <Sparkles className="size-4" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary/10 border border-primary/20" : "bg-muted"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="size-8 rounded-lg grid place-items-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}><Sparkles className="size-4" /></div>
                <div className="bg-muted rounded-2xl px-4 py-2.5 text-sm flex items-center gap-2 text-muted-foreground"><Loader2 className="size-3.5 animate-spin" /> Pensando…</div>
              </div>
            )}
          </>
        )}
      </div>

      <form onSubmit={e => { e.preventDefault(); send(); }} className="mt-3 flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Pergunte algo… (Enter para enviar, Shift+Enter quebra linha)"
          rows={2}
          className="resize-none"
          disabled={sending}
        />
        <Button type="submit" disabled={sending || !input.trim()} size="lg">
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </form>
    </div>
  );
}
