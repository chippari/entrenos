import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

// Demonstração temporária: a sessão do morador fica num cookie que só o servidor lê (P-08).
const COOKIE_DA_SESSAO = "demo_sessao";

type Tokens = { access_token: string; refresh_token: string };

export async function gravarSessao({ access_token, refresh_token }: Tokens): Promise<void> {
  (await cookies()).set(COOKIE_DA_SESSAO, JSON.stringify({ access_token, refresh_token }), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function apagarSessao(): Promise<void> {
  (await cookies()).delete(COOKIE_DA_SESSAO);
}

function lerTokens(valor: string | undefined): Tokens | null {
  try {
    const { access_token, refresh_token } = JSON.parse(valor ?? "") as Partial<Tokens>;
    return typeof access_token === "string" && typeof refresh_token === "string"
      ? { access_token, refresh_token }
      : null;
  } catch {
    return null;
  }
}

// Devolve o usuario_id de quem está na sessão, ou null se não há sessão válida (a rota responde 401).
export async function lerSessao(): Promise<string | null> {
  const tokens = lerTokens((await cookies()).get(COOKIE_DA_SESSAO)?.value);
  if (!tokens) return null;

  // Este cliente só fala com o Auth. Depois de refreshSession ele guarda a sessão do morador e
  // passaria a consultar o banco como authenticated: quem lê o banco monta outro cliente.
  const { auth } = createAdminClient();
  const atual = await auth.getUser(tokens.access_token);
  if (atual.data.user) return atual.data.user.id;
  // Falha de rede não é sessão inválida: o erro sobe (500), e a tela não volta para o login.
  if (isAuthRetryableFetchError(atual.error)) throw new Error("demo: falha ao conferir a sessão no Supabase Auth");

  // O access_token expirou: troca pelo refresh_token e regrava o cookie.
  const renovada = await auth.refreshSession({ refresh_token: tokens.refresh_token });
  if (renovada.data.session && renovada.data.user) {
    await gravarSessao(renovada.data.session);
    return renovada.data.user.id;
  }
  if (isAuthRetryableFetchError(renovada.error)) throw new Error("demo: falha ao renovar a sessão no Supabase Auth");
  return null;
}
