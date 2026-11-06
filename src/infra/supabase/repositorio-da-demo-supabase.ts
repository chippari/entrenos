import type { SupabaseClient } from "@supabase/supabase-js";
import type { PedidoDaDemo, RepositorioDaDemo } from "@/portas/repositorio-da-demo";

// P-04: as colunas são escritas uma a uma, sem select('*').
const COLUNAS_DO_MORADOR = "usuario_id, nome, unidade, telefone";
const COLUNAS_DO_PEDIDO = "id, titulo, descricao, categoria, data_e_hora, status, solicitante, apoiador";

type LinhaDoMorador = { usuario_id: string; nome: string; unidade: string; telefone: string };

type LinhaDoPedido = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  data_e_hora: string;
  status: PedidoDaDemo["status"];
  solicitante: string;
  apoiador: string | null;
};

// Só o código do erro; a mensagem do banco não sai daqui. Se a promessa rejeitar (falha de rede), o erro sobe.
function conferir<R extends { error: { code: string } | null }>(resultado: R, operacao: string): R {
  if (resultado.error) throw new Error(`Falha ao ${operacao} da demonstração (código ${resultado.error.code})`);
  return resultado;
}

function paraOPedido(linha: LinhaDoPedido): PedidoDaDemo {
  return {
    id: linha.id,
    titulo: linha.titulo,
    descricao: linha.descricao,
    categoria: linha.categoria,
    dataEHora: linha.data_e_hora,
    status: linha.status,
    solicitanteId: linha.solicitante,
    apoiadorId: linha.apoiador,
  };
}

// Demonstração temporária: tabelas demo_moradores e demo_pedidos, usadas só pelo service_role (P-03).
export function criarRepositorioDaDemoSupabase(cliente: SupabaseClient): RepositorioDaDemo {
  return {
    async moradorPorId(id) {
      const { data } = conferir(
        await cliente.from("demo_moradores").select(COLUNAS_DO_MORADOR).eq("usuario_id", id).maybeSingle(),
        "ler o morador",
      );
      const linha = data as LinhaDoMorador | null;
      return linha && { id: linha.usuario_id, nome: linha.nome, unidade: linha.unidade, telefone: linha.telefone };
    },

    async listarPedidos(limite) {
      const { data } = conferir(
        await cliente
          .from("demo_pedidos")
          .select(COLUNAS_DO_PEDIDO)
          .order("criado_em", { ascending: false })
          .limit(limite),
        "listar os pedidos",
      );
      return (data as LinhaDoPedido[]).map(paraOPedido);
    },

    async contarPedidos() {
      const { count } = conferir(
        await cliente.from("demo_pedidos").select("id", { count: "exact", head: true }),
        "contar os pedidos",
      );
      return count ?? 0;
    },

    async criarPedido(dados) {
      conferir(
        await cliente.from("demo_pedidos").insert({
          titulo: dados.titulo,
          descricao: dados.descricao,
          categoria: dados.categoria,
          data_e_hora: dados.dataEHora,
          solicitante: dados.solicitanteId,
          status: "aberta",
        }),
        "criar o pedido",
      );
    },

    async lerPedido(id) {
      const { data } = conferir(
        await cliente.from("demo_pedidos").select(COLUNAS_DO_PEDIDO).eq("id", id).maybeSingle(),
        "ler o pedido",
      );
      const linha = data as LinhaDoPedido | null;
      return linha && paraOPedido(linha);
    },

    // P-01: UPDATE condicionado ao status lido e, quando informado, ao apoiador esperado.
    async gravarTransicao({ id, statusLido, apoiadorEsperado, novoStatus, novoApoiadorId }) {
      let gravacao = cliente
        .from("demo_pedidos")
        .update({ status: novoStatus, apoiador: novoApoiadorId })
        .eq("id", id)
        .eq("status", statusLido);
      if (apoiadorEsperado !== undefined) gravacao = gravacao.eq("apoiador", apoiadorEsperado);
      const { data } = conferir(await gravacao.select("id"), "gravar a transição do pedido");
      return (data ?? []).length > 0;
    },

    async apagarTodos() {
      // O supabase-js exige um filtro no delete; este vale para todas as linhas.
      conferir(await cliente.from("demo_pedidos").delete().not("id", "is", null), "apagar os pedidos");
    },
  };
}
