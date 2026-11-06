// Horário de uma solicitação (DEF-CS-01; docs/specs/ciclo-da-solicitacao.md).
export const FUSO_DA_SOLICITACAO = "America/Sao_Paulo";

// DEF-CS-01 e RF-CS-22: o horário passou quando o momento atual é igual ou posterior à data e hora.
export function horarioPassou(dataEHora: Date, agora: Date): boolean {
  return agora.getTime() >= dataEHora.getTime();
}

// RF-CS-03: só o formato exato "AAAA-MM-DDTHH:mm".
const FORMATO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

const RELOGIO_DO_FUSO = new Intl.DateTimeFormat("en-US", {
  timeZone: FUSO_DA_SOLICITACAO,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

// DEF-CS-01: quanto o relógio do fuso está à frente do UTC nesse instante (negativo em São Paulo).
// Vem do Intl, e não de um valor fixo, para continuar certo se o fuso mudar de regra.
function deslocamentoDoFuso(instante: number): number {
  const partes = Object.fromEntries(
    RELOGIO_DO_FUSO.formatToParts(instante).map((parte) => [parte.type, Number(parte.value)]),
  );
  const horaDoFusoComoUtc = Date.UTC(
    partes.year,
    partes.month - 1,
    partes.day,
    partes.hour,
    partes.minute,
    partes.second,
  );
  return horaDoFusoComoUtc - instante;
}

// DEF-CS-01 e RF-CS-03: lê "AAAA-MM-DDTHH:mm" na hora de São Paulo e devolve o instante,
// ou null se o texto não for uma data e hora válidas.
export function lerDataEHoraLocal(texto: string): Date | null {
  const encontrado = FORMATO.exec(texto);
  if (!encontrado) {
    return null;
  }
  const [ano, mes, dia, hora, minuto] = encontrado.slice(1).map(Number);

  // RF-CS-03: dia, mês, hora ou minuto que não existem (ex.: 30 de fevereiro, 24:00) não voltam iguais.
  const comoUtc = new Date(Date.UTC(ano, mes - 1, dia, hora, minuto));
  if (
    comoUtc.getUTCFullYear() !== ano ||
    comoUtc.getUTCMonth() !== mes - 1 ||
    comoUtc.getUTCDate() !== dia ||
    comoUtc.getUTCHours() !== hora ||
    comoUtc.getUTCMinutes() !== minuto
  ) {
    return null;
  }

  // DEF-CS-01: a hora lida é a do fuso. A segunda conferência acerta o deslocamento
  // quando ele muda entre o palpite e o instante final (troca de regra do fuso).
  const palpite = comoUtc.getTime() - deslocamentoDoFuso(comoUtc.getTime());
  return new Date(comoUtc.getTime() - deslocamentoDoFuso(palpite));
}
