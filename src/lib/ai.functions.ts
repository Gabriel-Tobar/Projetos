import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ChatInput = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
  })).min(1),
});

export const chatWithAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ChatInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI not configured");

    const systemMsg = {
      role: "system" as const,
      content: "Você é o copiloto pessoal de Gabriel Tobar, um CEO/empreendedor. Responda em português, de forma direta, estratégica e prática. Use markdown leve quando ajudar.",
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [systemMsg, ...data.messages],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI gateway error ${res.status}: ${text.slice(0, 200)}`);
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "Sem resposta.";
    return { content: content as string };
  });
