// Rótulos de exibição (RF-CS-41, RF-CS-42; docs/specs/ciclo-da-solicitacao.md). Rótulo não é status (P-02).
// Os textos aprovados ficam nas telas; aqui só o código de cada rótulo.
import { horarioPassou } from "@/dominio/solicitacao/horario";
import type { StatusDaSolicitacao } from "@/dominio/solicitacao/maquina-de-estados";

export type PapelNaSolicitacao = "solicitante" | "apoiador" | "nenhum";

export type Rotulo =
  | "horario_passou_ninguem_aceitou" // RF-CS-41: "Horário passou, ninguém aceitou"
  | "falta_concluir" // RF-CS-42: "Falta concluir"
  | "aguardando_quem_pediu_concluir"; // RF-CS-42: "Aguardando quem pediu concluir"

// Rótulo de cada status e papel quando o horário já passou. Fora desta tabela não há rótulo.
const ROTULOS_COM_HORARIO_PASSADO: Partial<
  Record<StatusDaSolicitacao, Partial<Record<PapelNaSolicitacao, Rotulo>>>
> = {
  // RF-CS-41.
  aberta: { solicitante: "horario_passou_ninguem_aceitou" },
  // RF-CS-42.
  aceita: { solicitante: "falta_concluir", apoiador: "aguardando_quem_pediu_concluir" },
};

export function rotuloDaSolicitacao(
  solicitacao: { status: StatusDaSolicitacao; dataEHora: Date },
  papel: PapelNaSolicitacao,
  agora: Date,
): Rotulo | null {
  // RF-CS-41, RF-CS-42: só há rótulo com o horário passado (DEF-CS-01).
  if (!horarioPassou(solicitacao.dataEHora, agora)) {
    return null;
  }
  return ROTULOS_COM_HORARIO_PASSADO[solicitacao.status]?.[papel] ?? null;
}
