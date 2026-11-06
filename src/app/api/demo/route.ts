import { lerSessao } from "@/app/api/demo/sessao";
import { criarPedidoDaDemo } from "@/casos-de-uso/demo/criar-pedido-da-demo";
import type { DependenciasDaDemo, RespostaDaDemo } from "@/casos-de-uso/demo/dependencias";
import { limparDemo } from "@/casos-de-uso/demo/limpar-demo";
import { listarPedidosDaDemo } from "@/casos-de-uso/demo/listar-pedidos-da-demo";
import { mudarPedidoDaDemo } from "@/casos-de-uso/demo/mudar-pedido-da-demo";
import type { AcaoNaSolicitacao } from "@/dominio/solicitacao/maquina-de-estados";
import { criarRepositorioDaDemoSupabase } from "@/infra/supabase/repositorio-da-demo-supabase";
import { createAdminClient } from "@/lib/supabase/admin";

// Demonstração temporária da apresentação. A rota só lê a sessão, traduz a entrada,
// monta o repositório e chama um caso de uso (ARQ-03); as regras ficam em casos-de-uso/demo/.
export const dynamic = "force-dynamic";

const ACOES: AcaoNaSolicitacao[] = ["aceitar", "desistir", "cancelar", "concluir"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const responder = ({ status, corpo }: RespostaDaDemo) => Response.json(corpo, { status });
const semSessao = () => responder({ status: 401, corpo: { motivo: "sem_sessao" } });
const texto = (valor: unknown) => (typeof valor === "string" ? valor : null);

// Erro do repositório vira exceção: o Next registra a mensagem e responde 500.
function dependencias(): DependenciasDaDemo {
  return { repositorio: criarRepositorioDaDemoSupabase(createAdminClient()), agora: new Date() };
}

export async function GET() {
  const eu = await lerSessao();
  if (!eu) return semSessao();
  return responder(await listarPedidosDaDemo(eu, dependencias()));
}

export async function POST(request: Request) {
  const eu = await lerSessao();
  if (!eu) return semSessao();

  const corpo = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (corpo?.acao === "criar") {
    const dados = {
      titulo: texto(corpo.titulo),
      descricao: texto(corpo.descricao),
      categoria: texto(corpo.categoria),
      dataEHora: texto(corpo.dataEHora),
    };
    return responder(await criarPedidoDaDemo(eu, dados, dependencias()));
  }

  const acao = ACOES.find((valor) => valor === corpo?.acao);
  const id = texto(corpo?.id);
  if (!acao || !id || !UUID.test(id)) return responder({ status: 400, corpo: { motivo: "pedido_invalido" } });
  return responder(await mudarPedidoDaDemo(eu, acao, id, texto(corpo?.apoiadorVistoId), dependencias()));
}

export async function DELETE() {
  const eu = await lerSessao();
  if (!eu) return semSessao();
  return responder(await limparDemo(dependencias()));
}
