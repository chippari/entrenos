import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { criarRepositorioDaDemoSupabase } from "@/infra/supabase/repositorio-da-demo-supabase";
import type { RepositorioDaDemo } from "@/portas/repositorio-da-demo";

// Dados de teste genéricos (ADR-35): rótulos, nunca nomes ou telefones de pessoas.
const USUARIO_1 = "00000000-0000-4000-8000-000000000001";
const USUARIO_2 = "00000000-0000-4000-8000-000000000002";
const PEDIDO_ID = "00000000-0000-4000-8000-0000000000aa";

const LINHA_DO_MORADOR = { usuario_id: USUARIO_1, nome: "Morador Teste 1", unidade: "Apto 101", telefone: "(11) 90000-0001" };
const LINHA_DO_PEDIDO = {
  id: PEDIDO_ID,
  titulo: "Regar as plantas da varanda",
  descricao: "São três vasos pequenos.",
  categoria: "regar_plantas",
  data_e_hora: "2026-11-07T12:00:00+00:00",
  status: "aceita",
  solicitante: USUARIO_1,
  apoiador: USUARIO_2,
};
const PEDIDO = {
  id: PEDIDO_ID,
  titulo: "Regar as plantas da varanda",
  descricao: "São três vasos pequenos.",
  categoria: "regar_plantas",
  dataEHora: "2026-11-07T12:00:00+00:00",
  status: "aceita",
  solicitanteId: USUARIO_1,
  apoiadorId: USUARIO_2,
};
const COLUNAS_DO_PEDIDO = "id, titulo, descricao, categoria, data_e_hora, status, solicitante, apoiador";

// Erro como o supabase-js devolve na execução: objeto JSON simples.
const ERRO_PERMISSAO = {
  code: "42501",
  message: "permission denied for table demo_pedidos",
  details: null,
  hint: null,
};

const METODOS_DA_CONSULTA = ["select", "insert", "update", "delete", "eq", "not", "order", "limit", "maybeSingle"] as const;

// Stub do cliente Supabase: resposta configurável, sem banco nem rede. Como a consulta do supabase-js,
// cada método devolve a própria consulta, e ela resolve com o resultado quando é esperada (await).
// As funções também registram as chamadas (Mock), para conferir a tabela, as colunas e os filtros.
function criarClienteFalso(resultado: unknown, falhaDeRede?: Error) {
  const consulta = Object.fromEntries(METODOS_DA_CONSULTA.map((metodo) => [metodo, vi.fn()])) as Record<
    (typeof METODOS_DA_CONSULTA)[number],
    ReturnType<typeof vi.fn>
  >;
  const esperavel = {
    ...consulta,
    then: (resolver: (valor: unknown) => unknown, rejeitar: (erro: unknown) => unknown) =>
      (falhaDeRede ? Promise.reject(falhaDeRede) : Promise.resolve(resultado)).then(resolver, rejeitar),
  };
  for (const metodo of METODOS_DA_CONSULTA) consulta[metodo].mockReturnValue(esperavel);
  const from = vi.fn().mockReturnValue(esperavel);
  const repositorio = criarRepositorioDaDemoSupabase({ from } as unknown as SupabaseClient);
  return { repositorio, from, ...consulta };
}

describe("criarRepositorioDaDemoSupabase", () => {
  it("deve devolver o morador quando existe cadastro para o usuário", async () => {
    // Atende a Issue #64 (b): moradores vindos do banco
    // ARRANGE
    const falso = criarClienteFalso({ data: LINHA_DO_MORADOR, error: null });

    // ACT
    const morador = await falso.repositorio.moradorPorId(USUARIO_1);

    // ASSERT
    expect(falso.from).toHaveBeenCalledWith("demo_moradores");
    expect(falso.select).toHaveBeenCalledWith("usuario_id, nome, unidade, telefone");
    expect(falso.eq).toHaveBeenCalledWith("usuario_id", USUARIO_1);
    expect(falso.maybeSingle).toHaveBeenCalledTimes(1);
    expect(morador).toEqual({ id: USUARIO_1, nome: "Morador Teste 1", unidade: "Apto 101", telefone: "(11) 90000-0001" });
  });

  it("deve devolver null quando não existe cadastro para o usuário", async () => {
    // Atende a Issue #64 (b): usuário sem cadastro
    // ARRANGE
    const falso = criarClienteFalso({ data: null, error: null });

    // ACT
    const morador = await falso.repositorio.moradorPorId(USUARIO_1);

    // ASSERT
    expect(morador).toBeNull();
  });

  it("deve listar os pedidos mais novos primeiro, até o limite, com as colunas escritas uma a uma", async () => {
    // Atende P-04 (consulta lista as colunas, sem select('*'))
    // ARRANGE
    const falso = criarClienteFalso({ data: [LINHA_DO_PEDIDO], error: null });

    // ACT
    const pedidos = await falso.repositorio.listarPedidos(30);

    // ASSERT
    expect(falso.from).toHaveBeenCalledWith("demo_pedidos");
    expect(falso.select).toHaveBeenCalledWith(COLUNAS_DO_PEDIDO);
    expect(falso.order).toHaveBeenCalledWith("criado_em", { ascending: false });
    expect(falso.limit).toHaveBeenCalledWith(30);
    expect(pedidos).toEqual([PEDIDO]);
  });

  it("deve devolver a contagem exata dos pedidos, sem trazer as linhas", async () => {
    // Atende o limite de 30 da demonstração
    // ARRANGE
    const falso = criarClienteFalso({ count: 7, data: null, error: null });

    // ACT
    const total = await falso.repositorio.contarPedidos();

    // ASSERT
    expect(falso.from).toHaveBeenCalledWith("demo_pedidos");
    expect(falso.select).toHaveBeenCalledWith("id", { count: "exact", head: true });
    expect(total).toBe(7);
  });

  it("deve devolver zero quando a contagem vem vazia", async () => {
    // Atende o limite de 30 da demonstração
    // ARRANGE
    const falso = criarClienteFalso({ count: null, data: null, error: null });

    // ACT
    const total = await falso.repositorio.contarPedidos();

    // ASSERT
    expect(total).toBe(0);
  });

  it("deve inserir o pedido aberto com o solicitante quando um pedido é criado", async () => {
    // Atende P-02 (todo pedido nasce aberta)
    // ARRANGE
    const falso = criarClienteFalso({ data: null, error: null });

    // ACT
    await falso.repositorio.criarPedido({
      titulo: "Regar as plantas da varanda",
      descricao: "São três vasos pequenos.",
      categoria: "regar_plantas",
      dataEHora: "2026-11-07T12:00:00.000Z",
      solicitanteId: USUARIO_1,
    });

    // ASSERT
    expect(falso.from).toHaveBeenCalledWith("demo_pedidos");
    expect(falso.insert).toHaveBeenCalledWith({
      titulo: "Regar as plantas da varanda",
      descricao: "São três vasos pequenos.",
      categoria: "regar_plantas",
      data_e_hora: "2026-11-07T12:00:00.000Z",
      solicitante: USUARIO_1,
      status: "aberta",
    });
  });

  it("deve devolver o pedido quando ele existe", async () => {
    // Atende P-01 (leitura antes da gravação condicionada)
    // ARRANGE
    const falso = criarClienteFalso({ data: LINHA_DO_PEDIDO, error: null });

    // ACT
    const pedido = await falso.repositorio.lerPedido(PEDIDO_ID);

    // ASSERT
    expect(falso.from).toHaveBeenCalledWith("demo_pedidos");
    expect(falso.select).toHaveBeenCalledWith(COLUNAS_DO_PEDIDO);
    expect(falso.eq).toHaveBeenCalledWith("id", PEDIDO_ID);
    expect(falso.maybeSingle).toHaveBeenCalledTimes(1);
    expect(pedido).toEqual(PEDIDO);
  });

  it("deve devolver null quando o pedido não existe", async () => {
    // Atende a recusa de pedido inexistente
    // ARRANGE
    const falso = criarClienteFalso({ data: null, error: null });

    // ACT
    const pedido = await falso.repositorio.lerPedido(PEDIDO_ID);

    // ASSERT
    expect(pedido).toBeNull();
  });

  it("deve gravar só se o pedido ainda estiver no status lido e devolver true quando uma linha muda", async () => {
    // Atende P-01
    // ARRANGE
    const falso = criarClienteFalso({ data: [{ id: PEDIDO_ID }], error: null });

    // ACT
    const mudou = await falso.repositorio.gravarTransicao({
      id: PEDIDO_ID,
      statusLido: "aberta",
      novoStatus: "aceita",
      novoApoiadorId: USUARIO_2,
    });

    // ASSERT
    expect(falso.from).toHaveBeenCalledWith("demo_pedidos");
    expect(falso.update).toHaveBeenCalledWith({ status: "aceita", apoiador: USUARIO_2 });
    expect(falso.eq.mock.calls).toEqual([
      ["id", PEDIDO_ID],
      ["status", "aberta"],
    ]);
    expect(falso.select).toHaveBeenCalledWith("id");
    expect(mudou).toBe(true);
  });

  it("deve condicionar a gravação também ao apoiador quando o apoiador esperado é informado", async () => {
    // Atende P-01 (na conclusão, também ao apoiador visto)
    // ARRANGE
    const falso = criarClienteFalso({ data: [{ id: PEDIDO_ID }], error: null });

    // ACT
    await falso.repositorio.gravarTransicao({
      id: PEDIDO_ID,
      statusLido: "aceita",
      apoiadorEsperado: USUARIO_2,
      novoStatus: "concluida",
      novoApoiadorId: USUARIO_2,
    });

    // ASSERT
    expect(falso.eq.mock.calls).toEqual([
      ["id", PEDIDO_ID],
      ["status", "aceita"],
      ["apoiador", USUARIO_2],
    ]);
  });

  it("deve devolver false quando nenhuma linha muda", async () => {
    // Atende P-01 (alguém mudou o pedido antes)
    // ARRANGE
    const falso = criarClienteFalso({ data: [], error: null });

    // ACT
    const mudou = await falso.repositorio.gravarTransicao({
      id: PEDIDO_ID,
      statusLido: "aberta",
      novoStatus: "aceita",
      novoApoiadorId: USUARIO_2,
    });

    // ASSERT
    expect(mudou).toBe(false);
  });

  it("deve apagar todas as linhas de demo_pedidos quando a demonstração é limpa", async () => {
    // Atende a ação "Limpar demonstração"
    // ARRANGE
    const falso = criarClienteFalso({ data: null, error: null });

    // ACT
    await falso.repositorio.apagarTodos();

    // ASSERT
    expect(falso.from).toHaveBeenCalledWith("demo_pedidos");
    expect(falso.delete).toHaveBeenCalledTimes(1);
    expect(falso.not).toHaveBeenCalledWith("id", "is", null);
  });

  const CHAMADAS: [string, (repositorio: RepositorioDaDemo) => Promise<unknown>][] = [
    ["moradorPorId", (repositorio) => repositorio.moradorPorId(USUARIO_1)],
    ["listarPedidos", (repositorio) => repositorio.listarPedidos(30)],
    ["contarPedidos", (repositorio) => repositorio.contarPedidos()],
    [
      "criarPedido",
      (repositorio) =>
        repositorio.criarPedido({
          titulo: "Regar as plantas da varanda",
          descricao: "São três vasos pequenos.",
          categoria: "regar_plantas",
          dataEHora: "2026-11-07T12:00:00.000Z",
          solicitanteId: USUARIO_1,
        }),
    ],
    ["lerPedido", (repositorio) => repositorio.lerPedido(PEDIDO_ID)],
    [
      "gravarTransicao",
      (repositorio) =>
        repositorio.gravarTransicao({ id: PEDIDO_ID, statusLido: "aberta", novoStatus: "aceita", novoApoiadorId: USUARIO_2 }),
    ],
    ["apagarTodos", (repositorio) => repositorio.apagarTodos()],
  ];

  it.each(CHAMADAS)("deve rejeitar com o código, sem a mensagem do banco, quando %s recebe erro", async (_metodo, chamar) => {
    // Atende P-08 (nenhum detalhe do banco em resposta ou log)
    // ARRANGE
    const falso = criarClienteFalso({ data: null, count: null, error: ERRO_PERMISSAO });

    // ACT
    const resultado = chamar(falso.repositorio);

    // ASSERT
    await expect(resultado).rejects.toThrow("42501");
    await expect(resultado).rejects.not.toThrow("permission denied");
  });

  it.each(CHAMADAS)("deve rejeitar quando a promessa de %s rejeita", async (_metodo, chamar) => {
    // Atende a regra da porta: falha de acesso aos dados vira erro
    // ARRANGE
    const falso = criarClienteFalso(null, new Error("fetch failed"));

    // ACT
    const resultado = chamar(falso.repositorio);

    // ASSERT
    await expect(resultado).rejects.toThrow();
  });
});
