import type { DependenciasDaDemo, RespostaDaDemo } from "@/casos-de-uso/demo/dependencias";
import { transicionar, type AcaoNaSolicitacao } from "@/dominio/solicitacao/maquina-de-estados";

export async function mudarPedidoDaDemo(
  eu: string,
  acao: AcaoNaSolicitacao,
  id: string,
  apoiadorVistoId: string | null,
  { repositorio }: DependenciasDaDemo,
): Promise<RespostaDaDemo> {
  const lido = await repositorio.lerPedido(id);
  if (!lido) return { status: 404, corpo: { motivo: "nao_encontrado" } };

  // P-02: a decisão é da máquina de estados do domínio.
  const resultado = transicionar(
    { status: lido.status, solicitanteId: lido.solicitanteId, apoiadorId: lido.apoiadorId },
    { acao, autorId: eu, apoiadorVistoId },
  );
  if (!resultado.ok) return { status: 409, corpo: { motivo: resultado.motivo } };

  // P-01: só grava se o pedido ainda estiver no status lido (e, na conclusão, com o apoiador visto).
  const mudou = await repositorio.gravarTransicao({
    id,
    statusLido: lido.status,
    apoiadorEsperado: acao === "concluir" ? (apoiadorVistoId ?? undefined) : undefined,
    novoStatus: resultado.estado.status,
    novoApoiadorId: resultado.estado.apoiadorId,
  });
  if (!mudou) return { status: 409, corpo: { motivo: acao === "aceitar" ? "ja_aceita" : "mudou" } };
  return { status: 200, corpo: { ok: true } };
}
