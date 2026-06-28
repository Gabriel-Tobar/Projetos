import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Perfil — Tobar OS" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setAge(profile.age?.toString() ?? "");
      setRole(profile.role ?? "");
      setCompany(profile.company ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName,
      age: age ? Number(age) : null,
      role: role || null,
      company: company || null,
      avatar_url: avatarUrl || null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado");
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  if (isLoading) return <div className="flex items-center justify-center py-16"><Loader2 className="size-6 animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Suas informações pessoais.</p>
      </div>
      <div className="surface-card p-6 space-y-4">
        <div><Label>Nome completo</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Idade</Label><Input type="number" value={age} onChange={e => setAge(e.target.value)} /></div>
          <div><Label>Cargo</Label><Input value={role} onChange={e => setRole(e.target.value)} placeholder="Ex: Estudante / Freelancer" /></div>
        </div>
        <div><Label>Empresa</Label><Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Ex: Elo Marketing" /></div>
        <div><Label>URL do avatar</Label><Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://…" /></div>
        <div><Label>E-mail</Label><Input value={user?.email ?? ""} disabled /></div>
        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
