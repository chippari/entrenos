import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Chamada 1x por dia pelo Vercel Cron para o Supabase não pausar o projeto.
export const dynamic = "force-dynamic";

function isAuthorized(header: string | null, secret: string): boolean {
  if (!header) return false;
  const received = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${secret}`);
  if (received.length !== expected.length) return false;
  return timingSafeEqual(received, expected);
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return Response.json(
      { ok: false, error: "CRON_SECRET não configurado" },
      { status: 500 },
    );
  }

  if (!isAuthorized(request.headers.get("authorization"), cronSecret)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch (e) {
    console.error(
      "keep-alive: configuração do Supabase ausente:",
      e instanceof Error ? e.message : "erro desconhecido",
    );
    return Response.json(
      { ok: false, error: "configuração do Supabase ausente" },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("keep_alive")
    .update({ pinged_at: new Date().toISOString() })
    .eq("id", 1)
    .select("pinged_at")
    .single();

  if (error) {
    console.error("keep-alive: erro do Supabase:", error.message);
    return Response.json(
      { ok: false, error: "falha ao atualizar keep_alive" },
      { status: 500 },
    );
  }

  return Response.json({ ok: true, pinged_at: data.pinged_at });
}
