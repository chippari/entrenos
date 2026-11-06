import { FUSO_DA_SOLICITACAO } from "@/dominio/solicitacao/horario";
import type { Categoria } from "@/dominio/solicitacao/validacao";

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

// P-04: só a categoria, o dia e o horário. Nada de quem pediu nem de quem aceitou, nem o título ou a descrição,
// que são texto livre. Ex.: "Regar plantas, sábado, 7 de novembro, às 9h" (hora cheia) ou "..., às 22h30".
function resumoDoPedido(categoria: string, dataEHora: Date): string {
  // O pedido lido do banco traz a categoria como texto: fora das sete (D-03), o texto não vai para o aviso.
  const rotulo = Object.hasOwn(ROTULOS_DAS_CATEGORIAS, categoria)
    ? ROTULOS_DAS_CATEGORIAS[categoria as Categoria]
    : ROTULOS_DAS_CATEGORIAS.outra_ajuda;
  const partes = Object.fromEntries(HORARIO_DO_AVISO.formatToParts(dataEHora).map((parte) => [parte.type, parte.value]));
  const horario = `${partes.hour}h${partes.minute === "00" ? "" : partes.minute}`;
  return `${rotulo}, ${DIA_DO_AVISO.format(dataEHora)}, às ${horario}`;
}

// Issue #66: aviso aos outros moradores quando um pedido é criado.
export function textoDoAvisoDeCriacao(categoria: Categoria, dataEHora: Date): string {
  return `Novo pedido de ajuda na sua comunidade: ${resumoDoPedido(categoria, dataEHora)}. Abra o EntreNós para ver.`;
}

// Issue #68: aviso a quem pediu quando um vizinho aceita.
export function textoDoAvisoDeAceite(categoria: string, dataEHora: Date): string {
  return `Um vizinho aceitou o seu pedido: ${resumoDoPedido(categoria, dataEHora)}. Abra o EntreNós para ver o contato.`;
}
