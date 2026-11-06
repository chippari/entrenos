import type { DependenciasDaDemo, RespostaDaDemo } from "@/casos-de-uso/demo/dependencias";
import { textoDoAvisoDeAceite } from "@/casos-de-uso/demo/texto-do-aviso";
import { transicionar, type AcaoNaSolicitacao } from "@/dominio/solicitacao/maquina-de-estados";
import type { Mensageiro } from "@/portas/mensageiro";

export async function mudarPedidoDaDemo(
  eu: string,
  acao: AcaoNaSolicitacao,
  id: string,
  apoiadorVistoId: string | null,
  { repositorio, mensageiro }: DependenciasDaDemo & { mensageiro: Mensageiro },
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

  // O aceite já está gravado: daqui em diante, falha do aviso não muda a resposta (como RF-TW-09).
  if (acao === "aceitar") {
    try {
      // P-04: só o chat de quem pediu; nenhum dado de quem aceitou entra no aviso.
      const chat = await repositorio.chatDoMorador(lido.solicitanteId);
      if (chat !== null) {
        await mensageiro.enviarTexto(chat, textoDoAvisoDeAceite(lido.categoria, new Date(lido.dataEHora)));
      }
    } catch {
      // RNF-TW-03: só o id do pedido no log, nunca o erro, o texto ou o chat.
      console.error(`Falha ao avisar quem pediu sobre o aceite do pedido (id ${id}).`);
    }
  }

  return { status: 200, corpo: { ok: true } };
}
