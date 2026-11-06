import { LIMITE_DE_PEDIDOS, type DependenciasDaDemo, type RespostaDaDemo } from "@/casos-de-uso/demo/dependencias";
import { FUSO_DA_SOLICITACAO } from "@/dominio/solicitacao/horario";
import { validarNovaSolicitacao, type Categoria, type DadosDaNovaSolicitacao } from "@/dominio/solicitacao/validacao";
import type { Mensageiro } from "@/portas/mensageiro";

// Os mesmos rótulos das telas da demonstração (D-03).
const ROTULOS_DAS_CATEGORIAS: Record<Categoria, string> = {
  receber_encomendas: "Receber encomendas",
  regar_plantas: "Regar plantas",
  pequenas_compras: "Pequenas compras",
  auxilio_com_tecnologia: "Auxílio com tecnologia",
  companhia: "Companhia",
  auxilio_visual: "Auxílio visual",
  outra_ajuda: "Outra ajuda",
};

// DEF-CS-01: o dia e o horário são os do fuso da solicitação.
const DIA_DO_AVISO = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_DA_SOLICITACAO,
  weekday: "long",
  day: "numeric",
  month: "long",
});
const HORARIO_DO_AVISO = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_DA_SOLICITACAO,
  hourCycle: "h23",
  hour: "numeric",
  minute: "2-digit",
});

// P-04: só a categoria, o dia e o horário. Nada de quem pediu, nem o título ou a descrição, que são texto livre.
// Ex.: "sábado, 7 de novembro, às 9h" (hora cheia) ou "sábado, 7 de novembro, às 22h30".
function textoDoAviso(categoria: Categoria, dataEHora: Date): string {
  const partes = Object.fromEntries(HORARIO_DO_AVISO.formatToParts(dataEHora).map((parte) => [parte.type, parte.value]));
  const horario = `${partes.hour}h${partes.minute === "00" ? "" : partes.minute}`;
  return `Novo pedido de ajuda na sua comunidade: ${ROTULOS_DAS_CATEGORIAS[categoria]}, ${DIA_DO_AVISO.format(dataEHora)}, às ${horario}. Abra o EntreNós para ver.`;
}

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
    const texto = textoDoAviso(categoria, dataEHora);
    const envios = await Promise.allSettled(chats.map((chat) => mensageiro.enviarTexto(chat, texto)));
    const falhas = envios.filter((envio) => envio.status === "rejected").length;
    // RNF-TW-03: só o id do pedido no log, nunca o erro, o texto ou o chat.
    if (falhas > 0) console.error(`Falha ao enviar ${falhas} de ${envios.length} avisos do pedido (id ${id}).`);
  } catch {
    console.error(`Falha ao buscar os chats para o aviso do pedido (id ${id}).`);
  }

  return { status: 201, corpo: { ok: true } };
}
