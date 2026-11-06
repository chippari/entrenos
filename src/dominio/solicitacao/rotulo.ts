// Rótulos de exibição (RF-CS-41, RF-CS-42; docs/specs/ciclo-da-solicitacao.md). Rótulo não é status (P-02).
// Os textos aprovados ficam nas telas; aqui só o código de cada rótulo.
import type { StatusDaSolicitacao } from "@/dominio/solicitacao/maquina-de-estados";

export type PapelNaSolicitacao = "solicitante" | "apoiador" | "nenhum";

export type Rotulo =
  | "horario_passou_ninguem_aceitou" // RF-CS-41: "Horário passou, ninguém aceitou"
  | "falta_concluir" // RF-CS-42: "Falta concluir"
  | "aguardando_quem_pediu_concluir"; // RF-CS-42: "Aguardando quem pediu concluir"

export function rotuloDaSolicitacao(
  solicitacao: { status: StatusDaSolicitacao; dataEHora: Date },
  papel: PapelNaSolicitacao,
  agora: Date,
): Rotulo | null {
  void solicitacao;
  void papel;
  void agora;
  throw new Error("Não implementado (T-16).");
}
