// Horário de uma solicitação (DEF-CS-01; docs/specs/ciclo-da-solicitacao.md).
export const FUSO_DA_SOLICITACAO = "America/Sao_Paulo";

// DEF-CS-01 e RF-CS-22: o horário passou quando o momento atual é igual ou posterior à data e hora.
export function horarioPassou(dataEHora: Date, agora: Date): boolean {
  void dataEHora;
  void agora;
  throw new Error("Não implementado (T-16).");
}

// DEF-CS-01 e RF-CS-03: lê "AAAA-MM-DDTHH:mm" na hora de São Paulo e devolve o instante,
// ou null se o texto não for uma data e hora válidas.
export function lerDataEHoraLocal(texto: string): Date | null {
  void texto;
  throw new Error("Não implementado (T-16).");
}
