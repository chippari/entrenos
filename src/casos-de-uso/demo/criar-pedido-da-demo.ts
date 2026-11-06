import { LIMITE_DE_PEDIDOS, type DependenciasDaDemo, type RespostaDaDemo } from "@/casos-de-uso/demo/dependencias";
import { textoDoAvisoDeCriacao } from "@/casos-de-uso/demo/texto-do-aviso";
import { validarNovaSolicitacao, type DadosDaNovaSolicitacao } from "@/dominio/solicitacao/validacao";
import type { Mensageiro } from "@/portas/mensageiro";

export async function criarPedidoDaDemo(
  eu: string,
  dados: DadosDaNovaSolicitacao,
  { repositorio, agora, mensageiro }: DependenciasDaDemo & { mensageiro: Mensageiro },
): Promise<RespostaDaDemo> {
  // P-02: a validação da criação é do domínio.
  const resultado = validarNovaSolicitacao(dados, agora);
  if (!resultado.ok) return { status: 400, corpo: { erros: resultado.erros } };

  if ((await repositorio.contarPedidos()) >= LIMITE_DE_PEDIDOS) return { status: 429, corpo: { motivo: "limite" } };

  const { titulo, descricao, categoria, dataEHora } = resultado.valores;
  const id = await repositorio.criarPedido({ titulo, descricao, categoria, dataEHora: dataEHora.toISOString(), solicitanteId: eu });

  // O pedido já está gravado: daqui em diante, falha do aviso não muda a resposta (como RF-TW-09).
  try {
    const chats = await repositorio.chatsParaAviso(eu);
    const texto = textoDoAvisoDeCriacao(categoria, dataEHora);
    const envios = await Promise.allSettled(chats.map((chat) => mensageiro.enviarTexto(chat, texto)));
    const falhas = envios.filter((envio) => envio.status === "rejected").length;
    // RNF-TW-03: só o id do pedido no log, nunca o erro, o texto ou o chat.
    if (falhas > 0) console.error(`Falha ao enviar ${falhas} de ${envios.length} avisos do pedido (id ${id}).`);
  } catch {
    console.error(`Falha ao buscar os chats para o aviso do pedido (id ${id}).`);
  }

  return { status: 201, corpo: { ok: true } };
}
