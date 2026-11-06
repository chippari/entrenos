// Máquina de estados da solicitação (P-02; docs/specs/ciclo-da-solicitacao.md).
export type StatusDaSolicitacao = "aberta" | "aceita" | "concluida" | "cancelada";

export type AcaoNaSolicitacao = "aceitar" | "desistir" | "cancelar" | "concluir";

export type EstadoDaSolicitacao = {
  status: StatusDaSolicitacao;
  solicitanteId: string;
  apoiadorId: string | null;
};

export type PedidoDeTransicao = {
  acao: AcaoNaSolicitacao;
  autorId: string;
  // Só na conclusão: o apoiador que o solicitante via (RF-CS-36).
  apoiadorVistoId?: string | null;
};

export type MotivoDaRecusa =
  | "proprio_solicitante" // RF-CS-19
  | "encerrada" // RF-CS-20, RF-CS-30, RF-CS-34
  | "ja_e_o_apoiador" // RF-CS-44
  | "ja_aceita" // RF-CS-21
  | "nao_esta_aceita" // RF-CS-25
  | "nao_e_o_apoiador" // RF-CS-26
  | "nao_e_o_solicitante" // RF-CS-29, RF-CS-33
  | "ninguem_aceitou" // RF-CS-35
  | "apoiador_mudou" // RF-CS-36
  | "transicao_invalida"; // RF-CS-38

export type ResultadoDaTransicao =
  | { ok: true; estado: EstadoDaSolicitacao }
  | { ok: false; motivo: MotivoDaRecusa };

type Conferencia = {
  recusaSe: (estado: EstadoDaSolicitacao, pedido: PedidoDeTransicao) => boolean;
  motivo: MotivoDaRecusa;
};

type RegraDaAcao = {
  // Recusas na ordem das conferências da spec; vale a primeira que se aplica.
  conferencias: Conferencia[];
  // Linhas da tabela de transições: status antes → status depois (RB-CS-01).
  destinos: Partial<Record<StatusDaSolicitacao, StatusDaSolicitacao>>;
  // O que muda no apoiador (RB-CS-08).
  apoiador: (estado: EstadoDaSolicitacao, pedido: PedidoDeTransicao) => string | null;
};

// RB-CS-01: Concluída e Cancelada são finais.
const FINAIS: StatusDaSolicitacao[] = ["concluida", "cancelada"];

// RF-CS-20, RF-CS-30, RF-CS-34.
const encerrada: Conferencia = {
  recusaSe: (estado) => FINAIS.includes(estado.status),
  motivo: "encerrada",
};

// RF-CS-29, RF-CS-33.
const naoEOSolicitante: Conferencia = {
  recusaSe: (estado, pedido) => pedido.autorId !== estado.solicitanteId,
  motivo: "nao_e_o_solicitante",
};

const manterApoiador = (estado: EstadoDaSolicitacao) => estado.apoiadorId;

// Tabela de transições da spec (P-02, RNF-CS-05).
const TABELA: Record<AcaoNaSolicitacao, RegraDaAcao> = {
  aceitar: {
    conferencias: [
      // RF-CS-19, RB-CS-07.
      { recusaSe: (estado, pedido) => pedido.autorId === estado.solicitanteId, motivo: "proprio_solicitante" },
      encerrada,
      // RF-CS-44.
      {
        recusaSe: (estado, pedido) => estado.status === "aceita" && estado.apoiadorId === pedido.autorId,
        motivo: "ja_e_o_apoiador",
      },
      // RF-CS-21.
      { recusaSe: (estado) => estado.status === "aceita", motivo: "ja_aceita" },
    ],
    destinos: { aberta: "aceita" },
    // RB-CS-08: passa a ser quem aceitou.
    apoiador: (_estado, pedido) => pedido.autorId,
  },
  desistir: {
    conferencias: [
      // RF-CS-25.
      { recusaSe: (estado) => estado.status !== "aceita", motivo: "nao_esta_aceita" },
      // RF-CS-26.
      { recusaSe: (estado, pedido) => pedido.autorId !== estado.apoiadorId, motivo: "nao_e_o_apoiador" },
    ],
    destinos: { aceita: "aberta" },
    // RB-CS-08: na desistência, volta a não ter apoiador.
    apoiador: () => null,
  },
  cancelar: {
    conferencias: [naoEOSolicitante, encerrada],
    destinos: { aberta: "cancelada", aceita: "cancelada" },
    // RB-CS-08: no cancelamento, o apoiador continua registrado.
    apoiador: manterApoiador,
  },
  concluir: {
    conferencias: [
      naoEOSolicitante,
      encerrada,
      // RF-CS-35.
      { recusaSe: (estado) => estado.status === "aberta", motivo: "ninguem_aceitou" },
      // RF-CS-36: o pedido precisa trazer o apoiador que o solicitante via, e ele precisa ser o atual.
      {
        recusaSe: (estado, pedido) => pedido.apoiadorVistoId == null || pedido.apoiadorVistoId !== estado.apoiadorId,
        motivo: "apoiador_mudou",
      },
    ],
    destinos: { aceita: "concluida" },
    // RB-CS-08: na conclusão, o apoiador continua registrado.
    apoiador: manterApoiador,
  },
};

export function transicionar(
  estado: EstadoDaSolicitacao,
  pedido: PedidoDeTransicao,
): ResultadoDaTransicao {
  // RF-CS-38: ação fora da tabela.
  if (!Object.hasOwn(TABELA, pedido.acao)) {
    return { ok: false, motivo: "transicao_invalida" };
  }
  const regra = TABELA[pedido.acao];

  const recusa = regra.conferencias.find((conferencia) => conferencia.recusaSe(estado, pedido));
  if (recusa) {
    return { ok: false, motivo: recusa.motivo };
  }

  // RF-CS-38: combinação de ação e status que nenhuma recusa própria cobre.
  const destino = Object.hasOwn(regra.destinos, estado.status) ? regra.destinos[estado.status] : undefined;
  if (!destino) {
    return { ok: false, motivo: "transicao_invalida" };
  }

  // Objeto novo: o estado recebido nunca muda (RF-CS-38, "nada muda").
  return {
    ok: true,
    estado: { ...estado, status: destino, apoiadorId: regra.apoiador(estado, pedido) },
  };
}
