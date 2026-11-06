import {
  transicionar,
  type AcaoNaSolicitacao,
  type StatusDaSolicitacao,
} from "@/dominio/solicitacao/maquina-de-estados";
import { validarNovaSolicitacao } from "@/dominio/solicitacao/validacao";
import { createAdminClient } from "@/lib/supabase/admin";

// Demonstração temporária da apresentação: dois moradores fictícios, sem login.
// Só traduz a entrada e usa as regras do domínio (P-02); a gravação é condicionada (P-01).
export const dynamic = "force-dynamic";

type Morador = { nome: string; unidade: string; telefone: string };

const MORADORES: Record<string, Morador> = {
  ana: { nome: "Ana", unidade: "Apto 12", telefone: "(11) 90000-0012" },
  bruno: { nome: "Bruno", unidade: "Apto 34", telefone: "(11) 90000-0034" },
};

const LIMITE = 30;
const ACOES: AcaoNaSolicitacao[] = ["aceitar", "desistir", "cancelar", "concluir"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Linha = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  data_e_hora: string;
  status: StatusDaSolicitacao;
  solicitante: string;
  apoiador: string | null;
};

const responder = (corpo: unknown, status = 200) => Response.json(corpo, { status });
const texto = (valor: unknown) => (typeof valor === "string" ? valor : null);

function morador(id: unknown): string | null {
  return typeof id === "string" && Object.hasOwn(MORADORES, id) ? id : null;
}

// Erro do Supabase vira exceção: o Next registra a mensagem e responde 500.
function conferir<R extends { error: { message: string } | null }>(resultado: R): R {
  if (resultado.error) throw new Error(`demo: erro do Supabase: ${resultado.error.message}`);
  return resultado;
}

// P-04: a lista nunca diz quem pediu; o contato só vai para as duas partes, só com o pedido aceito.
function paraATela(linha: Linha, eu: string) {
  const ehMeu = linha.solicitante === eu;
  const souApoiador = linha.apoiador === eu;
  const outraParte = linha.status !== "aceita" ? null : ehMeu ? linha.apoiador : souApoiador ? linha.solicitante : null;
  return {
    id: linha.id,
    titulo: linha.titulo,
    descricao: linha.descricao,
    categoria: linha.categoria,
    data_e_hora: linha.data_e_hora,
    status: linha.status,
    ehMeu,
    souApoiador,
    apoiadorId: ehMeu ? linha.apoiador : null,
    contato: morador(outraParte) ? MORADORES[outraParte as string] : null,
  };
}

export async function GET(request: Request) {
  const eu = morador(new URL(request.url).searchParams.get("eu"));
  if (!eu) return responder({ motivo: "morador_invalido" }, 400);

  const { data } = conferir(
    await createAdminClient()
      .from("demo_pedidos")
      .select("id, titulo, descricao, categoria, data_e_hora, status, solicitante, apoiador")
      .order("criado_em", { ascending: false })
      .limit(LIMITE),
  );
  return responder({ pedidos: (data as Linha[]).map((linha) => paraATela(linha, eu)) });
}

export async function POST(request: Request) {
  const corpo = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const eu = morador(corpo?.eu);
  if (!corpo || !eu) return responder({ motivo: "morador_invalido" }, 400);

  if (corpo.acao === "criar") return criar(eu, corpo);
  const acao = ACOES.find((valor) => valor === corpo.acao);
  const id = texto(corpo.id);
  if (!acao || !id || !UUID.test(id)) return responder({ motivo: "pedido_invalido" }, 400);
  return mudar(eu, acao, id, texto(corpo.apoiadorVistoId));
}

async function criar(eu: string, corpo: Record<string, unknown>) {
  const resultado = validarNovaSolicitacao(
    {
      titulo: texto(corpo.titulo),
      descricao: texto(corpo.descricao),
      categoria: texto(corpo.categoria),
      dataEHora: texto(corpo.dataEHora),
    },
    new Date(),
  );
  if (!resultado.ok) return responder({ erros: resultado.erros }, 400);

  const supabase = createAdminClient();
  const { count } = conferir(await supabase.from("demo_pedidos").select("id", { count: "exact", head: true }));
  if ((count ?? 0) >= LIMITE) return responder({ motivo: "limite" }, 429);

  const { titulo, descricao, categoria, dataEHora } = resultado.valores;
  conferir(
    await supabase.from("demo_pedidos").insert({
      titulo,
      descricao,
      categoria,
      data_e_hora: dataEHora.toISOString(),
      solicitante: eu,
      status: "aberta",
    }),
  );
  return responder({ ok: true }, 201);
}

async function mudar(eu: string, acao: AcaoNaSolicitacao, id: string, apoiadorVistoId: string | null) {
  const supabase = createAdminClient();
  const leitura = conferir(
    await supabase.from("demo_pedidos").select("status, solicitante, apoiador").eq("id", id).maybeSingle(),
  );
  const lida = leitura.data as Pick<Linha, "status" | "solicitante" | "apoiador"> | null;
  if (!lida) return responder({ motivo: "nao_encontrado" }, 404);

  // P-02: a decisão é da máquina de estados do domínio.
  const resultado = transicionar(
    { status: lida.status, solicitanteId: lida.solicitante, apoiadorId: lida.apoiador },
    { acao, autorId: eu, apoiadorVistoId },
  );
  if (!resultado.ok) return responder({ motivo: resultado.motivo }, 409);

  // P-01: só grava se a linha ainda estiver no status lido (e, na conclusão, com o apoiador visto).
  let gravacao = supabase
    .from("demo_pedidos")
    .update({ status: resultado.estado.status, apoiador: resultado.estado.apoiadorId })
    .eq("id", id)
    .eq("status", lida.status);
  if (acao === "concluir") gravacao = gravacao.eq("apoiador", apoiadorVistoId as string);
  const { data } = conferir(await gravacao.select("id"));
  if (data?.length === 0) return responder({ motivo: acao === "aceitar" ? "ja_aceita" : "mudou" }, 409);
  return responder({ ok: true });
}

export async function DELETE(request: Request) {
  if (!morador(new URL(request.url).searchParams.get("eu"))) {
    return responder({ motivo: "morador_invalido" }, 400);
  }
  conferir(await createAdminClient().from("demo_pedidos").delete().not("id", "is", null));
  return responder({ ok: true });
}
