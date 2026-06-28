import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Entrar — Gabriel Tobar OS" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard", replace: true });
  }, [session, loading, navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/dashboard", replace: true });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Entrando…");
    // auto_confirm is on, so we can sign in immediately
    const { error: e2 } = await supabase.auth.signInWithPassword({ email, password });
    if (e2) return toast.error(e2.message);
    navigate({ to: "/dashboard", replace: true });
  };

  const forgot = async () => {
    if (!email) return toast.error("Informe o e-mail primeiro.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Verifique seu e-mail para redefinir a senha.");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-glow)" }} />
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="size-14 rounded-2xl grid place-items-center mb-4" style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}>
            <Sparkles className="size-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Gabriel Tobar <span className="text-gradient">OS</span></h1>
          <p className="text-sm text-muted-foreground mt-2">Organize sua vida. Execute como um CEO.</p>
        </div>

        <div className="surface-elevated p-6">
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full mb-6 bg-muted">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastro</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4">
                <div>
                  <Label htmlFor="si-email">E-mail</Label>
                  <Input id="si-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@email.com" />
                </div>
                <div>
                  <Label htmlFor="si-pw">Senha</Label>
                  <Input id="si-pw" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <button type="button" onClick={forgot} className="text-xs text-muted-foreground hover:text-primary transition-colors">Esqueci minha senha</button>
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? <Loader2 className="size-4 animate-spin" /> : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4">
                <div>
                  <Label htmlFor="su-name">Nome completo</Label>
                  <Input id="su-name" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Gabriel Tobar" />
                </div>
                <div>
                  <Label htmlFor="su-email">E-mail</Label>
                  <Input id="su-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="su-pw">Senha</Label>
                  <Input id="su-pw" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                </div>
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? <Loader2 className="size-4 animate-spin" /> : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
