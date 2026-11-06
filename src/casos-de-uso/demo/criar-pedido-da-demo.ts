import { LIMITE_DE_PEDIDOS, type DependenciasDaDemo, type RespostaDaDemo } from "@/casos-de-uso/demo/dependencias";
import { validarNovaSolicitacao, type DadosDaNovaSolicitacao } from "@/dominio/solicitacao/validacao";

export async function criarPedidoDaDemo(
  eu: string,
  dados: DadosDaNovaSolicitacao,
  { repositorio, agora }: DependenciasDaDemo,
): Promise<RespostaDaDemo> {
  // P-02: a validação da criação é do domínio.
  const resultado = validarNovaSolicitacao(dados, agora);
  if (!resultado.ok) return { status: 400, corpo: { erros: resultado.erros } };

  if ((await repositorio.contarPedidos()) >= LIMITE_DE_PEDIDOS) return { status: 429, corpo: { motivo: "limite" } };

  const { titulo, descricao, categoria, dataEHora } = resultado.valores;
  await repositorio.criarPedido({ titulo, descricao, categoria, dataEHora: dataEHora.toISOString(), solicitanteId: eu });
  return { status: 201, corpo: { ok: true } };
}
