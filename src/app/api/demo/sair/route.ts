import { apagarSessao } from "@/app/api/demo/sessao";

// Demonstração temporária: sair apaga o cookie da sessão.
export const dynamic = "force-dynamic";

export async function POST() {
  await apagarSessao();
  return Response.json({ ok: true });
}
