import { describe, expect, it } from "vitest";
import type { StatusDaSolicitacao } from "@/dominio/solicitacao/maquina-de-estados";
import { rotuloDaSolicitacao, type PapelNaSolicitacao, type Rotulo } from "@/dominio/solicitacao/rotulo";

// 12:00 em São Paulo.
const AGORA = new Date("2026-11-06T15:00:00.000Z");

const UMA_HORA = 60 * 60 * 1000;
const NAO_PASSOU = new Date(AGORA.getTime() + UMA_HORA);
const PASSOU = new Date(AGORA.getTime() - UMA_HORA);

type Linha = {
  status: StatusDaSolicitacao;
  horario: "não passou" | "passou";
  dataEHora: Date;
  papel: PapelNaSolicitacao;
  esperado: Rotulo | null;
};

describe("rotuloDaSolicitacao", () => {
  // Atende RF-CS-41, RF-CS-42 (fora dessas condições não há rótulo; quem não é solicitante nem apoiador nunca recebe rótulo)
  it.each<Linha>([
    { status: "aberta", horario: "não passou", dataEHora: NAO_PASSOU, papel: "solicitante", esperado: null },
    { status: "aberta", horario: "não passou", dataEHora: NAO_PASSOU, papel: "apoiador", esperado: null },
    { status: "aberta", horario: "não passou", dataEHora: NAO_PASSOU, papel: "nenhum", esperado: null },
    { status: "aberta", horario: "passou", dataEHora: PASSOU, papel: "solicitante", esperado: "horario_passou_ninguem_aceitou" },
    { status: "aberta", horario: "passou", dataEHora: PASSOU, papel: "apoiador", esperado: null },
    { status: "aberta", horario: "passou", dataEHora: PASSOU, papel: "nenhum", esperado: null },
    { status: "aceita", horario: "não passou", dataEHora: NAO_PASSOU, papel: "solicitante", esperado: null },
    { status: "aceita", horario: "não passou", dataEHora: NAO_PASSOU, papel: "apoiador", esperado: null },
    { status: "aceita", horario: "não passou", dataEHora: NAO_PASSOU, papel: "nenhum", esperado: null },
    { status: "aceita", horario: "passou", dataEHora: PASSOU, papel: "solicitante", esperado: "falta_concluir" },
    { status: "aceita", horario: "passou", dataEHora: PASSOU, papel: "apoiador", esperado: "aguardando_quem_pediu_concluir" },
    { status: "aceita", horario: "passou", dataEHora: PASSOU, papel: "nenhum", esperado: null },
    { status: "concluida", horario: "não passou", dataEHora: NAO_PASSOU, papel: "solicitante", esperado: null },
    { status: "concluida", horario: "não passou", dataEHora: NAO_PASSOU, papel: "apoiador", esperado: null },
    { status: "concluida", horario: "não passou", dataEHora: NAO_PASSOU, papel: "nenhum", esperado: null },
    { status: "concluida", horario: "passou", dataEHora: PASSOU, papel: "solicitante", esperado: null },
    { status: "concluida", horario: "passou", dataEHora: PASSOU, papel: "apoiador", esperado: null },
    { status: "concluida", horario: "passou", dataEHora: PASSOU, papel: "nenhum", esperado: null },
    { status: "cancelada", horario: "não passou", dataEHora: NAO_PASSOU, papel: "solicitante", esperado: null },
    { status: "cancelada", horario: "não passou", dataEHora: NAO_PASSOU, papel: "apoiador", esperado: null },
    { status: "cancelada", horario: "não passou", dataEHora: NAO_PASSOU, papel: "nenhum", esperado: null },
    { status: "cancelada", horario: "passou", dataEHora: PASSOU, papel: "solicitante", esperado: null },
    { status: "cancelada", horario: "passou", dataEHora: PASSOU, papel: "apoiador", esperado: null },
    { status: "cancelada", horario: "passou", dataEHora: PASSOU, papel: "nenhum", esperado: null },
  ])(
    "deve devolver $esperado quando a solicitação está $status, o horário $horario e o papel é $papel",
    ({ status, dataEHora, papel, esperado }) => {
      // ARRANGE
      const solicitacao = { status, dataEHora };

      // ACT
      const resultado = rotuloDaSolicitacao(solicitacao, papel, AGORA);

      // ASSERT
      expect(resultado).toBe(esperado);
    },
  );

  // Atende DEF-CS-01, RF-CS-42
  it("deve devolver falta_concluir quando a solicitação aceita tem a data e hora igual ao momento atual e o papel é solicitante", () => {
    // ARRANGE
    const solicitacao = { status: "aceita" as const, dataEHora: new Date(AGORA.getTime()) };

    // ACT
    const resultado = rotuloDaSolicitacao(solicitacao, "solicitante", AGORA);

    // ASSERT
    expect(resultado).toBe("falta_concluir");
  });
});
