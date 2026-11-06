import { LIMITE_DE_PEDIDOS, type DependenciasDaDemo, type RespostaDaDemo } from "@/casos-de-uso/demo/dependencias";
import type { Morador, PedidoDaDemo, RepositorioDaDemo } from "@/portas/repositorio-da-demo";

// O contato não leva o id do morador.
function contatoDo(morador: Morador | null) {
  return morador && { nome: morador.nome, unidade: morador.unidade, telefone: morador.telefone };
}

// P-04: a lista nunca diz quem pediu; o contato só vai para as duas partes, só com o pedido aceito.
async function paraATela(pedido: PedidoDaDemo, eu: string, repositorio: RepositorioDaDemo) {
  const ehMeu = pedido.solicitanteId === eu;
  const souApoiador = pedido.apoiadorId === eu;
  const outraParte =
    pedido.status !== "aceita" ? null : ehMeu ? pedido.apoiadorId : souApoiador ? pedido.solicitanteId : null;
  return {
    id: pedido.id,
    titulo: pedido.titulo,
    descricao: pedido.descricao,
    categoria: pedido.categoria,
    data_e_hora: pedido.dataEHora,
    status: pedido.status,
    ehMeu,
    souApoiador,
    apoiadorId: ehMeu ? pedido.apoiadorId : null,
    contato: outraParte ? contatoDo(await repositorio.moradorPorId(outraParte)) : null,
  };
}

export async function listarPedidosDaDemo(eu: string, { repositorio }: DependenciasDaDemo): Promise<RespostaDaDemo> {
  // Só morador cadastrado usa a demonstração; os dados dele vão para a saudação e para o Perfil.
  const morador = await repositorio.moradorPorId(eu);
  if (!morador) return { status: 403, corpo: { motivo: "sem_cadastro" } };

  const pedidos = await repositorio.listarPedidos(LIMITE_DE_PEDIDOS);
  return {
    status: 200,
    corpo: { morador, pedidos: await Promise.all(pedidos.map((pedido) => paraATela(pedido, eu, repositorio))) },
  };
}
