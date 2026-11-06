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

export function transicionar(
  estado: EstadoDaSolicitacao,
  pedido: PedidoDeTransicao,
): ResultadoDaTransicao {
  void estado;
  void pedido;
  throw new Error("Não implementado (T-15).");
}
