import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { gravarSessao } from "@/app/api/demo/sessao";
import { criarRepositorioDaDemoSupabase } from "@/infra/supabase/repositorio-da-demo-supabase";
import { createAdminClient } from "@/lib/supabase/admin";

// Demonstração temporária: login só no servidor. O navegador nunca fala com o Supabase (P-08).
export const dynamic = "force-dynamic";

const texto = (valor: unknown) => (typeof valor === "string" ? valor : "");

export async function POST(request: Request) {
  const corpo = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const email = texto(corpo?.email).trim();
  const senha = texto(corpo?.senha);
  if (!email || !senha) return Response.json({ motivo: "dados_invalidos" }, { status: 400 });

  // A resposta e o log nunca levam o e-mail, a senha nem o erro do Auth.
  const { data, error } = await createAdminClient().auth.signInWithPassword({ email, password: senha });
  // Falha de rede não é senha errada: o erro sobe (500).
  if (isAuthRetryableFetchError(error)) throw new Error("demo: falha ao entrar pelo Supabase Auth");
  if (!data.session || !data.user) return Response.json({ motivo: "credenciais_invalidas" }, { status: 401 });

  // Cliente novo: o de cima guardou a sessão do morador e consultaria o banco como authenticated.
  const morador = await criarRepositorioDaDemoSupabase(createAdminClient()).moradorPorId(data.user.id);
  if (!morador) return Response.json({ motivo: "sem_cadastro" }, { status: 403 });

  await gravarSessao(data.session);
  return Response.json({ ok: true, morador });
}
