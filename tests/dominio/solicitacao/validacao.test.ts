import { describe, expect, it } from "vitest";
import { validarNovaSolicitacao, type DadosDaNovaSolicitacao } from "@/dominio/solicitacao/validacao";

// 12:00 em São Paulo.
const AGORA = new Date("2026-11-06T15:00:00.000Z");

const VALIDOS: DadosDaNovaSolicitacao = {
  titulo: "Regar as plantas",
  descricao: "Vasos da varanda",
  categoria: "regar_plantas",
  dataEHora: "2026-11-07T10:00",
};

describe("validarNovaSolicitacao", () => {
  describe("dados válidos", () => {
    // Atende RF-CS-03, RF-CS-04, RF-CS-05, RF-CS-06
    it("deve devolver ok com os valores prontos quando todos os campos passam nas conferências", () => {
      // ARRANGE
      const dados = { ...VALIDOS };

      // ACT
      const resultado = validarNovaSolicitacao(dados, AGORA);

      // ASSERT
      expect(resultado).toEqual({
        ok: true,
        valores: {
          titulo: "Regar as plantas",
          descricao: "Vasos da varanda",
          categoria: "regar_plantas",
          dataEHora: new Date("2026-11-07T13:00:00.000Z"),
        },
      });
    });

    // Atende DEF-CS-05
    it("deve devolver o título e a descrição sem os espaços do começo e do fim quando eles vêm com espaços", () => {
      // ARRANGE
      const dados = { ...VALIDOS, titulo: "  Regar as plantas  ", descricao: "\tVasos da varanda\n" };

      // ACT
      const resultado = validarNovaSolicitacao(dados, AGORA);

      // ASSERT
      expect(resultado.ok).toBe(true);
      if (resultado.ok) {
        expect(resultado.valores.titulo).toBe("Regar as plantas");
        expect(resultado.valores.descricao).toBe("Vasos da varanda");
      }
    });

    // Atende RF-CS-06
    it("deve devolver ok quando a data e hora é 1 minuto depois do momento atual", () => {
      // ARRANGE
      const dados = { ...VALIDOS, dataEHora: "2026-11-06T12:01" };

      // ACT
      const resultado = validarNovaSolicitacao(dados, AGORA);

      // ASSERT
      expect(resultado.ok).toBe(true);
    });
  });

  describe("campos vazios", () => {
    // Atende RF-CS-03, DEF-CS-04
    it("deve informar o título vazio quando o título é texto vazio", () => {
      // ARRANGE
      const dados = { ...VALIDOS, titulo: "" };

      // ACT
      const resultado = validarNovaSolicitacao(dados, AGORA);

      // ASSERT
      expect(resultado).toEqual({ ok: false, erros: [{ campo: "titulo", problema: "vazio" }] });
    });

    // Atende RF-CS-03, DEF-CS-04
    it("deve informar a descrição vazia quando a descrição tem só espaços, tabulação e quebra de linha", () => {
      // ARRANGE
      const dados = { ...VALIDOS, descricao: " \t\n " };

      // ACT
      const resultado = validarNovaSolicitacao(dados, AGORA);

      // ASSERT
      expect(resultado).toEqual({ ok: false, erros: [{ campo: "descricao", problema: "vazio" }] });
    });

    // Atende RF-CS-03, DEF-CS-04
    it("deve informar a categoria vazia quando a categoria está ausente", () => {
      // ARRANGE
      const dados = { ...VALIDOS, categoria: undefined };

      // ACT
      const resultado = validarNovaSolicitacao(dados, AGORA);

      // ASSERT
      expect(resultado).toEqual({ ok: false, erros: [{ campo: "categoria", problema: "vazio" }] });
    });

    // Atende RF-CS-03, DEF-CS-04
    it("deve informar a data e hora vazia quando a data e hora é null", () => {
      // ARRANGE
      const dados = { ...VALIDOS, dataEHora: null };

      // ACT
      const resultado = validarNovaSolicitacao(dados, AGORA);

      // ASSERT
      expect(resultado).toEqual({ ok: false, erros: [{ campo: "dataEHora", problema: "vazio" }] });
    });
  });

  describe("tamanho dos textos", () => {
    // Atende RF-CS-04
    it("deve devolver ok quando o título tem exatamente 80 caracteres", () => {
      // ARRANGE
      const dados = { ...VALIDOS, titulo: "a".repeat(80) };

      // ACT
      const resultado = validarNovaSolicitacao(dados, AGORA);

      // ASSERT
      expect(resultado.ok).toBe(true);
    });

    // Atende RF-CS-04
    it("deve informar o título muito longo com o limite quando o título tem 81 caracteres", () => {
      // ARRANGE
      const dados = { ...VALIDOS, titulo: "a".repeat(81) };

      // ACT
      const resultado = validarNovaSolicitacao(dados, AGORA);

      // ASSERT
      expect(resultado).toEqual({
        ok: false,
        erros: [{ campo: "titulo", problema: "muito_longo", limite: 80 }],
      });
    });

    // Atende RF-CS-04
    it("deve devolver ok quando a descrição tem exatamente 500 caracteres", () => {
      // ARRANGE
      const dados = { ...VALIDOS, descricao: "a".repeat(500) };

      // ACT
      const resultado = validarNovaSolicitacao(dados, AGORA);

      // ASSERT
      expect(resultado.ok).toBe(true);
    });

    // Atende RF-CS-04
    it("deve informar a descrição muito longa com o limite quando a descrição tem 501 caracteres", () => {
      // ARRANGE
      const dados = { ...VALIDOS, descricao: "a".repeat(501) };

      // ACT
      const resultado = validarNovaSolicitacao(dados, AGORA);

      // ASSERT
      expect(resultado).toEqual({
        ok: false,
        erros: [{ campo: "descricao", problema: "muito_longo", limite: 500 }],
      });
    });

    // Atende DEF-CS-05
    it("deve devolver ok quando o título tem 80 pontos de código com um emoji, embora length dê 81", () => {
      // ARRANGE
      const dados = { ...VALIDOS, titulo: "a".repeat(79) + "😀" };

      // ACT
      const resultado = validarNovaSolicitacao(dados, AGORA);

      // ASSERT
      expect(resultado.ok).toBe(true);
    });

    // Atende DEF-CS-05
    it("deve devolver ok quando o título tem 80 caracteres mais espaços no começo e no fim", () => {
      // ARRANGE
      const dados = { ...VALIDOS, titulo: "  " + "a".repeat(80) + "  " };

      // ACT
      const resultado = validarNovaSolicitacao(dados, AGORA);

      // ASSERT
      expect(resultado.ok).toBe(true);
    });
  });

  describe("categoria", () => {
    // Atende RF-CS-05
    it("deve informar a categoria inválida quando a categoria não é uma das sete", () => {
      // ARRANGE
      const dados = { ...VALIDOS, categoria: "jardinagem" };

      // ACT
      const resultado = validarNovaSolicitacao(dados, AGORA);

      // ASSERT
      expect(resultado).toEqual({ ok: false, erros: [{ campo: "categoria", problema: "categoria_invalida" }] });
    });

    // Atende RF-CS-05, D-03, DC-07
    it.each([
      { nome: "receber encomendas", categoria: "receber_encomendas" },
      { nome: "regar plantas", categoria: "regar_plantas" },
      { nome: "pequenas compras", categoria: "pequenas_compras" },
      { nome: "auxílio com tecnologia", categoria: "auxilio_com_tecnologia" },
      { nome: "companhia", categoria: "companhia" },
      { nome: "auxílio visual", categoria: "auxilio_visual" },
      { nome: "outra ajuda", categoria: "outra_ajuda" },
    ])("deve devolver ok quando a categoria é $nome", ({ categoria }) => {
      // ARRANGE
      const dados = { ...VALIDOS, categoria };

      // ACT
      const resultado = validarNovaSolicitacao(dados, AGORA);

      // ASSERT
      expect(resultado.ok).toBe(true);
    });
  });

  describe("data e hora", () => {
    // Atende RF-CS-03
    it("deve informar a data e hora inválida quando o dia não existe", () => {
      // ARRANGE
      const dados = { ...VALIDOS, dataEHora: "2026-02-30T10:00" };

      // ACT
      const resultado = validarNovaSolicitacao(dados, AGORA);

      // ASSERT
      expect(resultado).toEqual({ ok: false, erros: [{ campo: "dataEHora", problema: "data_e_hora_invalida" }] });
    });

    // Atende RF-CS-06, DEF-CS-01
    it("deve informar que a data e hora está no passado quando ela é igual ao momento atual", () => {
      // ARRANGE
      const dados = { ...VALIDOS, dataEHora: "2026-11-06T12:00" };

      // ACT
      const resultado = validarNovaSolicitacao(dados, AGORA);

      // ASSERT
      expect(resultado).toEqual({ ok: false, erros: [{ campo: "dataEHora", problema: "no_passado" }] });
    });

    // Atende RF-CS-06
    it("deve informar que a data e hora está no passado quando ela é 1 minuto antes do momento atual", () => {
      // ARRANGE
      const dados = { ...VALIDOS, dataEHora: "2026-11-06T11:59" };

      // ACT
      const resultado = validarNovaSolicitacao(dados, AGORA);

      // ASSERT
      expect(resultado).toEqual({ ok: false, erros: [{ campo: "dataEHora", problema: "no_passado" }] });
    });
  });

  describe("vários erros", () => {
    // Atende RF-CS-03, RF-CS-04, RF-CS-05, RF-CS-06 (todos os erros de uma vez, na ordem dos campos)
    it("deve informar todos os campos com problema na ordem dos campos quando vários campos falham", () => {
      // ARRANGE
      const dados = { ...VALIDOS, titulo: "", categoria: "jardinagem", dataEHora: "2026-11-01T10:00" };

      // ACT
      const resultado = validarNovaSolicitacao(dados, AGORA);

      // ASSERT
      expect(resultado).toEqual({
        ok: false,
        erros: [
          { campo: "titulo", problema: "vazio" },
          { campo: "categoria", problema: "categoria_invalida" },
          { campo: "dataEHora", problema: "no_passado" },
        ],
      });
    });
  });
});
