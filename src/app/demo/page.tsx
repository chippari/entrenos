"use client";

// Demonstração temporária da apresentação: dois celulares, um morador fictício em cada.
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { FUSO_DA_SOLICITACAO } from "@/dominio/solicitacao/horario";
import { CATEGORIAS, type Categoria, type ErroDeCampo } from "@/dominio/solicitacao/validacao";

type Contato = { nome: string; unidade: string; telefone: string };

type Pedido = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  data_e_hora: string;
  status: "aberta" | "aceita" | "concluida" | "cancelada";
  ehMeu: boolean;
  souApoiador: boolean;
  apoiadorId: string | null;
  contato: Contato | null;
};

type Acao = "aceitar" | "desistir" | "cancelar" | "concluir";

const MORADORES: Record<string, { artigo: string; nome: string; unidade: string }> = {
  ana: { artigo: "a", nome: "Ana", unidade: "Apto 12" },
  bruno: { artigo: "o", nome: "Bruno", unidade: "Apto 34" },
};

const ROTULOS_DAS_CATEGORIAS: Record<Categoria, string> = {
  receber_encomendas: "Receber encomendas",
  regar_plantas: "Regar plantas",
  pequenas_compras: "Pequenas compras",
  auxilio_com_tecnologia: "Ajuda com tecnologia",
  companhia: "Companhia",
  auxilio_visual: "Auxílio visual",
  outra_ajuda: "Outra ajuda",
};

const STATUS: Record<Pedido["status"], { texto: string; cor: string }> = {
  aberta: { texto: "Aberto · esperando um vizinho", cor: "bg-amber-100 text-amber-900 border-amber-300" },
  aceita: { texto: "Aceito", cor: "bg-[#E3EFE7] text-[#1F4A31] border-[#2F6B48]" },
  concluida: { texto: "Concluído", cor: "bg-zinc-100 text-zinc-800 border-zinc-300" },
  cancelada: { texto: "Cancelado", cor: "bg-red-50 text-red-900 border-red-300" },
};

const BOTOES: Record<Acao, { primeiro: string; confirmar: string }> = {
  aceitar: { primeiro: "Aceitar", confirmar: "Confirmar aceite" },
  desistir: { primeiro: "Desistir", confirmar: "Confirmar desistência" },
  cancelar: { primeiro: "Cancelar", confirmar: "Confirmar cancelamento" },
  concluir: { primeiro: "Concluir", confirmar: "Confirmar conclusão" },
};

const MOTIVOS: Record<string, string> = {
  ja_aceita: "Outro vizinho aceitou primeiro.",
  apoiador_mudou: "Quem vai ajudar mudou. Confira antes de concluir.",
  mudou: "Este pedido mudou. A tela foi atualizada.",
  nao_encontrado: "Este pedido não existe mais.",
  proprio_solicitante: "Você não pode aceitar o seu próprio pedido.",
  encerrada: "Este pedido já foi encerrado.",
  ja_e_o_apoiador: "Você já aceitou este pedido.",
  nao_esta_aceita: "Este pedido não está aceito.",
  nao_e_o_apoiador: "Só quem aceitou pode desistir.",
  nao_e_o_solicitante: "Só quem pediu pode fazer isso.",
  ninguem_aceitou: "Ninguém aceitou este pedido ainda.",
  transicao_invalida: "Esta ação não vale para este pedido.",
  limite: "A demonstração chegou a 30 pedidos. Use “Limpar demonstração”.",
};

const NOMES_DOS_CAMPOS: Record<ErroDeCampo["campo"], string> = {
  titulo: "o título",
  descricao: "a descrição",
  categoria: "o tipo de ajuda",
  dataEHora: "o dia e o horário",
};

function mensagemDoErro(erro: ErroDeCampo): string {
  if (erro.problema === "muito_longo") return `Encurte ${NOMES_DOS_CAMPOS[erro.campo]}: até ${erro.limite} caracteres.`;
  if (erro.problema === "categoria_invalida") return "Escolha um tipo de ajuda da lista.";
  if (erro.problema === "data_e_hora_invalida") return "Dia ou horário inválido.";
  if (erro.problema === "no_passado") return "Escolha um horário que ainda não passou.";
  return `Preencha ${NOMES_DOS_CAMPOS[erro.campo]}.`;
}

const FORMATO_DA_DATA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_DA_SOLICITACAO,
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const ROTULO_DA_CATEGORIA = (categoria: string) =>
  ROTULOS_DAS_CATEGORIAS[categoria as Categoria] ?? categoria;

const BOTAO = "min-h-12 rounded-xl px-4 py-2 font-semibold";
const BOTAO_VERDE = `${BOTAO} bg-[#2F6B48] text-white active:bg-[#24533A] disabled:opacity-60`;
const BOTAO_CLARO = `${BOTAO} border-2 border-[#2F6B48] bg-white text-[#2F6B48]`;

export default function PaginaDaDemo() {
  return (
    <main className="min-h-full flex-1 bg-[#F4F7F2] text-[18px] text-zinc-900">
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-5 px-4 py-6">
        <Suspense fallback={<p>Carregando…</p>}>
          <Demo />
        </Suspense>
      </div>
    </main>
  );
}

function Demo() {
  const eu = useSearchParams().get("eu");
  if (!eu || !Object.hasOwn(MORADORES, eu)) return <Escolha />;
  return <Morador eu={eu} />;
}

function Escolha() {
  return (
    <>
      <h1 className="text-3xl font-bold text-[#2F6B48]">EntreNós</h1>
      <p>Escolha quem você é neste celular:</p>
      {Object.entries(MORADORES).map(([id, morador]) => (
        <Link key={id} href={`/demo?eu=${id}`} className={`${BOTAO_VERDE} flex items-center justify-center py-5 text-xl`}>
          Sou {morador.artigo} {morador.nome} ({morador.unidade})
        </Link>
      ))}
      <Rodape />
    </>
  );
}

function Morador({ eu }: { eu: string }) {
  const morador = MORADORES[eu];
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [confirmando, setConfirmando] = useState<{ id: string; acao: Acao } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const resposta = await fetch(`/api/demo?eu=${eu}`, { cache: "no-store" });
      if (resposta.ok) setPedidos(((await resposta.json()) as { pedidos: Pedido[] }).pedidos);
    } catch {
      // Sem rede por um instante: a próxima volta tenta de novo.
    }
  }, [eu]);

  useEffect(() => {
    const primeira = setTimeout(carregar, 0);
    const intervalo = setInterval(carregar, 2000);
    return () => {
      clearTimeout(primeira);
      clearInterval(intervalo);
    };
  }, [carregar]);

  async function agir(pedido: Pedido, acao: Acao) {
    if (confirmando?.id !== pedido.id || confirmando.acao !== acao) {
      setConfirmando({ id: pedido.id, acao });
      return;
    }
    setOcupado(true);
    setConfirmando(null);
    try {
      const resposta = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eu, acao, id: pedido.id, apoiadorVistoId: acao === "concluir" ? pedido.apoiadorId : undefined }),
      });
      const corpo = (await resposta.json().catch(() => ({}))) as { motivo?: string };
      setAviso(resposta.ok ? null : (MOTIVOS[corpo.motivo ?? ""] ?? "Algo deu errado. Tente de novo."));
    } catch {
      setAviso("Sem conexão. Tente de novo.");
    }
    await carregar();
    setOcupado(false);
  }

  async function limpar() {
    await fetch(`/api/demo?eu=${eu}`, { method: "DELETE" }).catch(() => null);
    setAviso(null);
    await carregar();
  }

  const dosVizinhos = (pedidos ?? []).filter((pedido) => !pedido.ehMeu && pedido.status === "aberta");
  const meus = (pedidos ?? []).filter((pedido) => pedido.ehMeu || pedido.souApoiador);

  const botaoDeAcao = (pedido: Pedido, acao: Acao) => {
    const emConfirmacao = confirmando?.id === pedido.id && confirmando.acao === acao;
    return (
      <button
        key={acao}
        type="button"
        disabled={ocupado}
        onClick={() => agir(pedido, acao)}
        className={emConfirmacao || acao === "aceitar" ? BOTAO_VERDE : BOTAO_CLARO}
      >
        {emConfirmacao ? BOTOES[acao].confirmar : BOTOES[acao].primeiro}
      </button>
    );
  };

  const botoesDe = (pedido: Pedido, acoes: Acao[]) => (
    <div className="flex flex-wrap gap-2">
      {acoes.map((acao) => botaoDeAcao(pedido, acao))}
      {confirmando?.id === pedido.id && (
        <button type="button" onClick={() => setConfirmando(null)} className={`${BOTAO} text-zinc-700 underline`}>
          Voltar
        </button>
      )}
    </div>
  );

  return (
    <>
      <header className="flex flex-col gap-1">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#2F6B48]">EntreNós</p>
        <h1 className="text-2xl font-bold">
          Você é {morador.artigo} {morador.nome} · {morador.unidade}
        </h1>
      </header>

      {aviso && (
        <p role="alert" className="rounded-xl border-2 border-amber-400 bg-amber-50 p-3 font-medium">
          {aviso}
        </p>
      )}

      {formularioAberto ? (
        <Formulario
          eu={eu}
          aoTerminar={async (criou) => {
            setFormularioAberto(false);
            if (criou) await carregar();
          }}
        />
      ) : (
        <button type="button" onClick={() => setFormularioAberto(true)} className={`${BOTAO_VERDE} py-4 text-xl`}>
          Pedir ajuda
        </button>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Pedidos dos vizinhos</h2>
        {pedidos === null && <p>Carregando…</p>}
        {pedidos !== null && dosVizinhos.length === 0 && <p className="text-zinc-600">Nenhum pedido aberto agora.</p>}
        {dosVizinhos.map((pedido) => (
          <Cartao key={pedido.id} pedido={pedido}>
            {botoesDe(pedido, ["aceitar"])}
          </Cartao>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Meus pedidos</h2>
        {pedidos !== null && meus.length === 0 && (
          <p className="text-zinc-600">Você ainda não pediu nem aceitou nenhuma ajuda.</p>
        )}
        {meus.map((pedido) => (
          <Cartao key={pedido.id} pedido={pedido} papel={pedido.ehMeu ? "Você pediu" : "Você vai ajudar"}>
            {pedido.contato && (
              <div className="rounded-xl bg-[#E3EFE7] p-3">
                <p className="font-semibold">
                  {pedido.ehMeu ? "Quem vai ajudar" : "Quem pediu"}: {pedido.contato.nome} · {pedido.contato.unidade}
                </p>
                <a
                  href={`tel:${pedido.contato.telefone.replace(/\D/g, "")}`}
                  className="inline-flex min-h-12 items-center font-semibold text-[#2F6B48] underline"
                >
                  Ligar: {pedido.contato.telefone}
                </a>
              </div>
            )}
            {pedido.ehMeu && pedido.status === "aberta" && botoesDe(pedido, ["cancelar"])}
            {pedido.ehMeu && pedido.status === "aceita" && botoesDe(pedido, ["concluir", "cancelar"])}
            {pedido.souApoiador && pedido.status === "aceita" && botoesDe(pedido, ["desistir"])}
          </Cartao>
        ))}
      </section>

      <Rodape aoLimpar={limpar} />
    </>
  );
}

function Cartao({ pedido, papel, children }: { pedido: Pedido; papel?: string; children: React.ReactNode }) {
  const status = STATUS[pedido.status];
  return (
    <article className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-3 py-0.5 text-base font-semibold ${status.cor}`}>{status.texto}</span>
        {papel && <span className="text-base text-zinc-600">{papel}</span>}
      </div>
      <h3 className="text-xl font-bold">{pedido.titulo}</h3>
      <p className="text-base text-zinc-700">
        {ROTULO_DA_CATEGORIA(pedido.categoria)} · {FORMATO_DA_DATA.format(new Date(pedido.data_e_hora))}
      </p>
      <p>{pedido.descricao}</p>
      {children}
    </article>
  );
}

function Formulario({ eu, aoTerminar }: { eu: string; aoTerminar: (criou: boolean) => Promise<void> }) {
  const [erros, setErros] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const campos = new FormData(evento.currentTarget);
    setEnviando(true);
    try {
      const resposta = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eu,
          acao: "criar",
          titulo: campos.get("titulo"),
          descricao: campos.get("descricao"),
          categoria: campos.get("categoria"),
          dataEHora: campos.get("dataEHora"),
        }),
      });
      if (resposta.ok) {
        await aoTerminar(true);
        return;
      }
      const corpo = (await resposta.json().catch(() => ({}))) as { erros?: ErroDeCampo[]; motivo?: string };
      setErros(
        corpo.erros?.map(mensagemDoErro) ?? [MOTIVOS[corpo.motivo ?? ""] ?? "Algo deu errado. Tente de novo."],
      );
    } catch {
      setErros(["Sem conexão. Tente de novo."]);
    }
    setEnviando(false);
  }

  const campo = "min-h-12 w-full rounded-xl border-2 border-zinc-300 bg-white px-3 py-2 text-[18px]";
  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-2xl border-2 border-[#2F6B48] bg-white p-4">
      <h2 className="text-xl font-bold">Pedir ajuda</h2>
      {erros.length > 0 && (
        <ul role="alert" className="list-disc rounded-xl bg-red-50 p-3 pl-8 text-red-900">
          {erros.map((erro) => (
            <li key={erro}>{erro}</li>
          ))}
        </ul>
      )}
      <label className="flex flex-col gap-1 font-medium">
        Título
        <input name="titulo" maxLength={80} className={campo} placeholder="Ex.: Receber um pacote" />
      </label>
      <label className="flex flex-col gap-1 font-medium">
        Tipo de ajuda
        <select name="categoria" defaultValue="" className={campo}>
          <option value="" disabled>
            Escolha…
          </option>
          {CATEGORIAS.map((categoria) => (
            <option key={categoria} value={categoria}>
              {ROTULOS_DAS_CATEGORIAS[categoria]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 font-medium">
        Dia e horário
        <input name="dataEHora" type="datetime-local" className={campo} />
      </label>
      <label className="flex flex-col gap-1 font-medium">
        Descrição
        <textarea name="descricao" maxLength={500} rows={3} className={campo} placeholder="Conte o que você precisa." />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={enviando} className={BOTAO_VERDE}>
          {enviando ? "Enviando…" : "Enviar pedido"}
        </button>
        <button type="button" onClick={() => aoTerminar(false)} className={BOTAO_CLARO}>
          Fechar
        </button>
      </div>
    </form>
  );
}

function Rodape({ aoLimpar }: { aoLimpar?: () => Promise<void> }) {
  const [confirmando, setConfirmando] = useState(false);
  return (
    <footer className="mt-6 flex flex-col items-center gap-2 border-t border-zinc-300 pt-4 text-sm text-zinc-600">
      <p>Demonstração · dados fictícios</p>
      {aoLimpar && (
        <button
          type="button"
          onClick={async () => {
            if (!confirmando) return setConfirmando(true);
            setConfirmando(false);
            await aoLimpar();
          }}
          className="min-h-11 px-3 underline"
        >
          {confirmando ? "Confirmar: apagar todos os pedidos" : "Limpar demonstração"}
        </button>
      )}
    </footer>
  );
}
