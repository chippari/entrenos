import { describe, expect, it } from "vitest";
import {
  transicionar,
  type AcaoNaSolicitacao,
  type EstadoDaSolicitacao,
  type StatusDaSolicitacao,
} from "@/dominio/solicitacao/maquina-de-estados";

const SOLICITANTE = "u-solicitante";
const APOIADOR = "u-apoiador";
const OUTRO = "u-outro";

describe("transicionar", () => {
  describe("transições válidas", () => {
    // Atende RB-CS-01, RB-CS-08
    it("deve passar para aceita com o autor como apoiador quando outro morador aceita uma solicitação aberta", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aberta", solicitanteId: SOLICITANTE, apoiadorId: null };

      // ACT
      const resultado = transicionar(estado, { acao: "aceitar", autorId: OUTRO });

      // ASSERT
      expect(resultado).toEqual({
        ok: true,
        estado: { status: "aceita", solicitanteId: SOLICITANTE, apoiadorId: OUTRO },
      });
    });

    // Atende RB-CS-01, RB-CS-08
    it("deve voltar para aberta sem apoiador quando o apoiador desiste de uma solicitação aceita", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aceita", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, { acao: "desistir", autorId: APOIADOR });

      // ASSERT
      expect(resultado).toEqual({
        ok: true,
        estado: { status: "aberta", solicitanteId: SOLICITANTE, apoiadorId: null },
      });
    });

    // Atende RB-CS-01
    it("deve passar para cancelada quando o solicitante cancela uma solicitação aberta", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aberta", solicitanteId: SOLICITANTE, apoiadorId: null };

      // ACT
      const resultado = transicionar(estado, { acao: "cancelar", autorId: SOLICITANTE });

      // ASSERT
      expect(resultado).toEqual({
        ok: true,
        estado: { status: "cancelada", solicitanteId: SOLICITANTE, apoiadorId: null },
      });
    });

    // Atende RB-CS-01, RB-CS-08
    it("deve passar para cancelada mantendo o apoiador quando o solicitante cancela uma solicitação aceita", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aceita", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, { acao: "cancelar", autorId: SOLICITANTE });

      // ASSERT
      expect(resultado).toEqual({
        ok: true,
        estado: { status: "cancelada", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR },
      });
    });

    // Atende RB-CS-01, RB-CS-08
    it("deve passar para concluida mantendo o apoiador quando o solicitante conclui uma solicitação aceita pelo apoiador que via", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aceita", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, {
        acao: "concluir",
        autorId: SOLICITANTE,
        apoiadorVistoId: APOIADOR,
      });

      // ASSERT
      expect(resultado).toEqual({
        ok: true,
        estado: { status: "concluida", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR },
      });
    });
  });

  describe("recusas", () => {
    // Atende RF-CS-19, RB-CS-07
    it("deve recusar com proprio_solicitante quando o solicitante tenta aceitar a própria solicitação", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aberta", solicitanteId: SOLICITANTE, apoiadorId: null };

      // ACT
      const resultado = transicionar(estado, { acao: "aceitar", autorId: SOLICITANTE });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "proprio_solicitante" });
    });

    // Atende RF-CS-20
    it("deve recusar com encerrada quando alguém tenta aceitar uma solicitação concluída", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "concluida", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, { acao: "aceitar", autorId: OUTRO });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "encerrada" });
    });

    // Atende RF-CS-20
    it("deve recusar com encerrada quando alguém tenta aceitar uma solicitação cancelada", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "cancelada", solicitanteId: SOLICITANTE, apoiadorId: null };

      // ACT
      const resultado = transicionar(estado, { acao: "aceitar", autorId: OUTRO });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "encerrada" });
    });

    // Atende RF-CS-44
    it("deve recusar com ja_e_o_apoiador quando o próprio apoiador tenta aceitar de novo", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aceita", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, { acao: "aceitar", autorId: APOIADOR });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "ja_e_o_apoiador" });
    });

    // Atende RF-CS-21
    it("deve recusar com ja_aceita quando outro morador tenta aceitar uma solicitação já aceita", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aceita", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, { acao: "aceitar", autorId: OUTRO });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "ja_aceita" });
    });

    // Atende RF-CS-25
    it("deve recusar com nao_esta_aceita quando alguém tenta desistir de uma solicitação aberta", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aberta", solicitanteId: SOLICITANTE, apoiadorId: null };

      // ACT
      const resultado = transicionar(estado, { acao: "desistir", autorId: APOIADOR });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "nao_esta_aceita" });
    });

    // Atende RF-CS-25
    it("deve recusar com nao_esta_aceita quando o apoiador tenta desistir de uma solicitação concluída", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "concluida", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, { acao: "desistir", autorId: APOIADOR });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "nao_esta_aceita" });
    });

    // Atende RF-CS-25
    it("deve recusar com nao_esta_aceita quando o apoiador tenta desistir de uma solicitação cancelada", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "cancelada", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, { acao: "desistir", autorId: APOIADOR });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "nao_esta_aceita" });
    });

    // Atende RF-CS-26
    it("deve recusar com nao_e_o_apoiador quando outro morador tenta desistir de uma solicitação aceita", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aceita", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, { acao: "desistir", autorId: OUTRO });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "nao_e_o_apoiador" });
    });

    // Atende RF-CS-26
    it("deve recusar com nao_e_o_apoiador quando o solicitante tenta desistir de uma solicitação aceita", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aceita", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, { acao: "desistir", autorId: SOLICITANTE });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "nao_e_o_apoiador" });
    });

    // Atende RF-CS-29
    it("deve recusar com nao_e_o_solicitante quando outro morador tenta cancelar uma solicitação aberta", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aberta", solicitanteId: SOLICITANTE, apoiadorId: null };

      // ACT
      const resultado = transicionar(estado, { acao: "cancelar", autorId: OUTRO });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "nao_e_o_solicitante" });
    });

    // Atende RF-CS-29
    it("deve recusar com nao_e_o_solicitante quando o apoiador tenta cancelar uma solicitação aceita", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aceita", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, { acao: "cancelar", autorId: APOIADOR });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "nao_e_o_solicitante" });
    });

    // Atende RF-CS-30
    it("deve recusar com encerrada quando o solicitante tenta cancelar uma solicitação concluída", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "concluida", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, { acao: "cancelar", autorId: SOLICITANTE });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "encerrada" });
    });

    // Atende RF-CS-30
    it("deve recusar com encerrada quando o solicitante tenta cancelar uma solicitação já cancelada", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "cancelada", solicitanteId: SOLICITANTE, apoiadorId: null };

      // ACT
      const resultado = transicionar(estado, { acao: "cancelar", autorId: SOLICITANTE });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "encerrada" });
    });

    // Atende RF-CS-33
    it("deve recusar com nao_e_o_solicitante quando o apoiador tenta concluir uma solicitação aceita", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aceita", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, {
        acao: "concluir",
        autorId: APOIADOR,
        apoiadorVistoId: APOIADOR,
      });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "nao_e_o_solicitante" });
    });

    // Atende RF-CS-34
    it("deve recusar com encerrada quando o solicitante tenta concluir uma solicitação já concluída", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "concluida", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, {
        acao: "concluir",
        autorId: SOLICITANTE,
        apoiadorVistoId: APOIADOR,
      });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "encerrada" });
    });

    // Atende RF-CS-34
    it("deve recusar com encerrada quando o solicitante tenta concluir uma solicitação cancelada", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "cancelada", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, {
        acao: "concluir",
        autorId: SOLICITANTE,
        apoiadorVistoId: APOIADOR,
      });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "encerrada" });
    });

    // Atende RF-CS-35
    it("deve recusar com ninguem_aceitou quando o solicitante tenta concluir uma solicitação aberta", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aberta", solicitanteId: SOLICITANTE, apoiadorId: null };

      // ACT
      const resultado = transicionar(estado, { acao: "concluir", autorId: SOLICITANTE });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "ninguem_aceitou" });
    });

    // Atende RF-CS-36
    it("deve recusar com apoiador_mudou quando o apoiador visto pelo solicitante é outro", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aceita", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, {
        acao: "concluir",
        autorId: SOLICITANTE,
        apoiadorVistoId: OUTRO,
      });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "apoiador_mudou" });
    });

    // Atende RF-CS-36
    it("deve recusar com apoiador_mudou quando o pedido de conclusão não informa o apoiador visto", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aceita", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, { acao: "concluir", autorId: SOLICITANTE });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "apoiador_mudou" });
    });

    // Atende RF-CS-36
    it("deve recusar com apoiador_mudou quando o apoiador visto é null mesmo que o estado aceita esteja sem apoiador", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aceita", solicitanteId: SOLICITANTE, apoiadorId: null };

      // ACT
      const resultado = transicionar(estado, {
        acao: "concluir",
        autorId: SOLICITANTE,
        apoiadorVistoId: null,
      });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "apoiador_mudou" });
    });

    // Atende RF-CS-38
    it("deve recusar com transicao_invalida quando o status atual está fora da tabela", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = {
        status: "expirada" as StatusDaSolicitacao,
        solicitanteId: SOLICITANTE,
        apoiadorId: null,
      };

      // ACT
      const resultado = transicionar(estado, { acao: "aceitar", autorId: OUTRO });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "transicao_invalida" });
    });

    // Atende RF-CS-38
    it("deve recusar com transicao_invalida quando a ação está fora da tabela", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aberta", solicitanteId: SOLICITANTE, apoiadorId: null };

      // ACT
      const resultado = transicionar(estado, {
        acao: "reabrir" as AcaoNaSolicitacao,
        autorId: SOLICITANTE,
      });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "transicao_invalida" });
    });
  });

  describe("ordem das conferências", () => {
    // Atende ordem do Aceitar: RF-CS-19 antes de RF-CS-20
    it("deve recusar com proprio_solicitante quando o solicitante tenta aceitar a própria solicitação concluída", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "concluida", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, { acao: "aceitar", autorId: SOLICITANTE });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "proprio_solicitante" });
    });

    // Atende ordem do Desistir: RF-CS-25 antes de RF-CS-26
    it("deve recusar com nao_esta_aceita quando outro morador tenta desistir de uma solicitação cancelada", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "cancelada", solicitanteId: SOLICITANTE, apoiadorId: null };

      // ACT
      const resultado = transicionar(estado, { acao: "desistir", autorId: OUTRO });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "nao_esta_aceita" });
    });

    // Atende ordem do Cancelar: RF-CS-29 antes de RF-CS-30
    it("deve recusar com nao_e_o_solicitante quando outro morador tenta cancelar uma solicitação concluída", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "concluida", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, { acao: "cancelar", autorId: OUTRO });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "nao_e_o_solicitante" });
    });

    // Atende ordem do Concluir: RF-CS-33 antes de RF-CS-34
    it("deve recusar com nao_e_o_solicitante quando o apoiador tenta concluir uma solicitação cancelada", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "cancelada", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, {
        acao: "concluir",
        autorId: APOIADOR,
        apoiadorVistoId: APOIADOR,
      });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "nao_e_o_solicitante" });
    });

    // Atende ordem do Concluir: RF-CS-34 antes de RF-CS-36
    it("deve recusar com encerrada quando o solicitante tenta concluir uma solicitação concluída vendo outro apoiador", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "concluida", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };

      // ACT
      const resultado = transicionar(estado, {
        acao: "concluir",
        autorId: SOLICITANTE,
        apoiadorVistoId: OUTRO,
      });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "encerrada" });
    });

    // Atende ordem do Concluir: RF-CS-35 antes de RF-CS-36
    it("deve recusar com ninguem_aceitou quando o solicitante tenta concluir uma solicitação aberta sem apoiador visto", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aberta", solicitanteId: SOLICITANTE, apoiadorId: null };

      // ACT
      const resultado = transicionar(estado, { acao: "concluir", autorId: SOLICITANTE });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "ninguem_aceitou" });
    });
  });

  describe("entrada não alterada", () => {
    // Atende RB-CS-01
    it("deve manter o estado recebido igual ao original quando a transição é válida", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aberta", solicitanteId: SOLICITANTE, apoiadorId: null };
      const copia = { ...estado };

      // ACT
      transicionar(estado, { acao: "aceitar", autorId: OUTRO });

      // ASSERT
      expect(estado).toEqual(copia);
    });

    // Atende RF-CS-21
    it("deve recusar com ja_aceita e manter o estado recebido igual ao original quando outro morador tenta aceitar uma solicitação aceita", () => {
      // ARRANGE
      const estado: EstadoDaSolicitacao = { status: "aceita", solicitanteId: SOLICITANTE, apoiadorId: APOIADOR };
      const copia = { ...estado };

      // ACT
      const resultado = transicionar(estado, { acao: "aceitar", autorId: OUTRO });

      // ASSERT
      expect(resultado).toEqual({ ok: false, motivo: "ja_aceita" });
      expect(estado).toEqual(copia);
    });
  });
});
