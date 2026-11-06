// Telas da demonstração, seguindo docs/mockups/ (criar-e-aceitar, meus-pedidos e eu-ajudo).
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  Eye,
  Info,
  Lock,
  Plus,
  RotateCcw,
  Smartphone,
  Tag,
  Trash2,
  User,
  UserCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { lerDataEHoraLocal } from "@/dominio/solicitacao/horario";
import { CATEGORIAS, type ErroDeCampo } from "@/dominio/solicitacao/validacao";
import type { Morador } from "@/portas/repositorio-da-demo";
import {
  Aviso,
  BotaoVoltar,
  CartaoDoContato,
  CartaoDoPedido,
  IconeDaCategoria,
  Selo,
  TIPOS_DE_AJUDA,
  dataLonga,
  rotuloDoPedido,
  tipoDeAjuda,
  type Acao,
  type Pedido,
} from "./pecas";

export type ResumoDoPedido = Pick<Pedido, "titulo" | "categoria" | "data_e_hora" | "status">;

export type Destino = "inicio" | "meus" | "detalhe";

// Recusas sem tela própria nos mockups: a mensagem vira o título da tela de aviso.
const MOTIVOS: Record<string, string> = {
  nao_e_o_solicitante: "Só quem pediu pode fazer isso.",
  transicao_invalida: "Esta ação não vale para este pedido.",
  limite: "A demonstração chegou a 30 pedidos. Use “Limpar demonstração”, no Perfil.",
  sem_conexao: "Sem conexão. Tente de novo.",
};
const ALGO_DEU_ERRADO = "Algo deu errado. Tente de novo.";

// Tela de login (sem sessão): sem mockup. O erro fica em texto, junto do campo (RNF-US-10, RU-03).
// A apresentação do projeto fica na página inicial (/).

export function Login({ aoEntrar }: { aoEntrar: (morador: Morador) => void }) {
  const [erros, setErros] = useState<{ email?: string; senha?: string }>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const campos = new FormData(evento.currentTarget);
    const email = String(campos.get("email") ?? "").trim();
    const senha = String(campos.get("senha") ?? "");
    setAviso(null);
    if (!email || !senha) {
      setErros({ email: email ? undefined : "Preencha o e-mail.", senha: senha ? undefined : "Preencha a senha." });
      return;
    }
    setEnviando(true);
    try {
      const resposta = await fetch("/api/demo/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      if (resposta.ok) {
        aoEntrar(((await resposta.json()) as { morador: Morador }).morador);
        return;
      }
      const { motivo } = (await resposta.json().catch(() => ({}))) as { motivo?: string };
      if (motivo === "credenciais_invalidas") setErros({ senha: "E-mail ou senha incorretos." });
      else if (motivo === "sem_cadastro") setErros({ email: "Esta conta não tem cadastro na demonstração." });
      else {
        setErros({});
        setAviso(ALGO_DEU_ERRADO);
      }
    } catch {
      setErros({});
      setAviso(MOTIVOS.sem_conexao);
    }
    setEnviando(false);
  }

  return (
    <form className="tela" onSubmit={enviar} noValidate>
      <p>
        <Link href="/" className="link">
          <ArrowLeft size={20} aria-hidden />
          Voltar ao início
        </Link>
      </p>
      <h1 className="titulo-tela">Entrar</h1>

      <section className="cartao">
        <label className="campo">
          E-mail
          <input
            name="email"
            type="email"
            autoComplete="username"
            className="entrada"
            aria-invalid={erros.email ? true : undefined}
            aria-describedby={erros.email ? "erro-email" : undefined}
          />
          <MensagemDeErro id="erro-email" texto={erros.email} />
        </label>
        <label className="campo">
          Senha
          <input
            name="senha"
            type="password"
            autoComplete="current-password"
            className="entrada"
            aria-invalid={erros.senha ? true : undefined}
            aria-describedby={erros.senha ? "erro-senha" : undefined}
          />
          <MensagemDeErro id="erro-senha" texto={erros.senha} />
        </label>
      </section>

      {aviso && (
        <p role="alert" className="linha">
          <Info size={22} aria-hidden />
          {aviso}
        </p>
      )}

      <div className="rodape">
        <button type="submit" className="botao botao-principal" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </div>
    </form>
  );
}

// Tela 1 de criar-e-aceitar: início.

export function Inicio({
  morador,
  pedidos,
  agora,
  aoPedirAjuda,
  aoAbrir,
}: {
  morador: Morador;
  pedidos: Pedido[] | null;
  agora: Date;
  aoPedirAjuda: () => void;
  aoAbrir: (id: string) => void;
}) {
  const [filtro, setFiltro] = useState<string | null>(null);
  // DT-08: o próprio pedido não aparece aqui. DC-08: a lista não diz quem pediu.
  const abertos = (pedidos ?? []).filter((pedido) => !pedido.ehMeu && pedido.status === "aberta");
  const filtrados = abertos.filter((pedido) => filtro === null || pedido.categoria === filtro);

  return (
    <div className="tela tela-com-barra">
      <header className="pessoa">
        <span className="avatar avatar-cheio">
          <User size={24} aria-hidden />
        </span>
        <div>
          <h1 className="nome">
            Olá, {morador.nome} · {morador.unidade}
          </h1>
          <p className="marca">EntreNós</p>
        </div>
      </header>

      <section className="cartao">
        <div>
          <h2 className="titulo-secao">Precisa de uma ajuda?</h2>
          <p className="apoio">Vizinhos que oferecem essa ajuda e estão disponíveis no horário recebem um aviso.</p>
        </div>
        <button type="button" className="botao botao-acento" onClick={aoPedirAjuda}>
          <Plus size={22} aria-hidden />
          Pedir ajuda
        </button>
      </section>

      <section className="lista">
        <div className="entre">
          <h2 className="titulo-secao">Pedidos dos vizinhos</h2>
          {pedidos !== null && (
            <p className="apoio">
              {abertos.length} {abertos.length === 1 ? "aberto" : "abertos"}
            </p>
          )}
        </div>
        <div className="filtros">
          <button type="button" className="filtro" aria-pressed={filtro === null} onClick={() => setFiltro(null)}>
            Todas
          </button>
          {CATEGORIAS.map((categoria) => (
            <button
              key={categoria}
              type="button"
              className="filtro"
              aria-pressed={filtro === categoria}
              onClick={() => setFiltro(categoria)}
            >
              {TIPOS_DE_AJUDA[categoria].rotulo}
            </button>
          ))}
        </div>
        {pedidos === null && <p className="apoio">Carregando…</p>}
        {pedidos !== null && filtrados.length === 0 && (
          <p className="apoio">{filtro === null ? "Nenhum pedido aberto agora." : "Nenhum pedido aberto deste tipo."}</p>
        )}
        {filtrados.map((pedido) => (
          <CartaoDoPedido key={pedido.id} pedido={pedido} agora={agora} comSelo={false} aoAbrir={() => aoAbrir(pedido.id)} />
        ))}
      </section>
    </div>
  );
}

// Telas 2 e 3 de criar-e-aceitar: pedir ajuda, com o erro junto do campo (RNF-US-10, RU-03).

type ErrosDoFormulario = Partial<Record<ErroDeCampo["campo"], string>>;

const TOQUE_PARA_ESCOLHER = "Toque para escolher";

const NOMES_DOS_CAMPOS: Record<ErroDeCampo["campo"], string> = {
  titulo: "o título",
  descricao: "a descrição",
  categoria: "o tipo de ajuda",
  dataEHora: "a data e o horário",
};

function mensagemDoErro(erro: ErroDeCampo): string {
  if (erro.campo === "titulo" && erro.problema === "vazio") return "Escreva um título para o pedido.";
  if (erro.campo === "categoria") return "Escolha um tipo de ajuda da lista.";
  if (erro.problema === "muito_longo") return `Encurte ${NOMES_DOS_CAMPOS[erro.campo]}: até ${erro.limite} caracteres.`;
  if (erro.problema === "data_e_hora_invalida") return "Preencha a data e o horário.";
  if (erro.problema === "no_passado") {
    return "Essa data e esse horário já passaram. Escolha um momento a partir de agora.";
  }
  return `Preencha ${NOMES_DOS_CAMPOS[erro.campo]}.`;
}

function MensagemDeErro({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null;
  return (
    <p id={id} className="mensagem-de-erro">
      <CircleAlert size={20} aria-hidden />
      {texto}
    </p>
  );
}

export function PedirAjuda({
  aoVoltar,
  aoPublicar,
}: {
  aoVoltar: () => void;
  aoPublicar: (resumo: ResumoDoPedido) => void;
}) {
  const [erros, setErros] = useState<ErrosDoFormulario>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  // No Safari do iPhone, a data e o horário vazios aparecem em branco: o texto de apoio diz o que fazer.
  const [temData, setTemData] = useState(false);
  const [temHorario, setTemHorario] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const campos = new FormData(evento.currentTarget);
    const valor = (nome: string) => String(campos.get(nome) ?? "");
    // A API recebe "AAAA-MM-DDTHH:mm"; a tela pergunta a data e o horário em dois campos.
    const dataEHora = valor("data") || valor("horario") ? `${valor("data")}T${valor("horario")}` : "";
    setEnviando(true);
    try {
      const resposta = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "criar",
          titulo: valor("titulo"),
          descricao: valor("descricao"),
          categoria: valor("categoria"),
          dataEHora,
        }),
      });
      if (resposta.ok) {
        aoPublicar({
          titulo: valor("titulo").trim(),
          categoria: valor("categoria"),
          data_e_hora: (lerDataEHoraLocal(dataEHora) ?? new Date()).toISOString(),
          status: "aberta",
        });
        return;
      }
      const corpo = (await resposta.json().catch(() => ({}))) as { erros?: ErroDeCampo[]; motivo?: string };
      setErros(Object.fromEntries((corpo.erros ?? []).map((erro) => [erro.campo, mensagemDoErro(erro)])));
      setAviso(corpo.erros ? null : (MOTIVOS[corpo.motivo ?? ""] ?? ALGO_DEU_ERRADO));
    } catch {
      setErros({});
      setAviso(MOTIVOS.sem_conexao);
    }
    setEnviando(false);
  }

  return (
    <form className="tela" onSubmit={enviar} noValidate>
      <header className="pessoa">
        <BotaoVoltar aoVoltar={aoVoltar} />
        <h1 className="titulo-secao">Pedir ajuda</h1>
      </header>

      <section className="cartao">
        <h2 className="rotulo">1. O que você precisa</h2>
        <label className="campo">
          Título
          <input
            name="titulo"
            maxLength={80}
            className="entrada"
            aria-invalid={erros.titulo ? true : undefined}
            aria-describedby={erros.titulo ? "erro-titulo" : undefined}
          />
          <MensagemDeErro id="erro-titulo" texto={erros.titulo} />
        </label>
        <label className="campo">
          Descrição
          <textarea
            name="descricao"
            maxLength={500}
            rows={3}
            className="entrada"
            aria-invalid={erros.descricao ? true : undefined}
            aria-describedby={erros.descricao ? "erro-descricao" : undefined}
          />
          <MensagemDeErro id="erro-descricao" texto={erros.descricao} />
        </label>
      </section>

      <section className="cartao">
        <h2 id="rotulo-tipo" className="rotulo">
          2. Tipo de ajuda
        </h2>
        <div
          role="radiogroup"
          className="tipos"
          aria-labelledby="rotulo-tipo"
          aria-describedby={erros.categoria ? "erro-categoria" : undefined}
        >
          {CATEGORIAS.map((categoria) => {
            const { rotulo, Icone } = TIPOS_DE_AJUDA[categoria];
            return (
              <label key={categoria} className={categoria === "outra_ajuda" ? "tipo tipo-outra" : "tipo"}>
                <input type="radio" name="categoria" value={categoria} className="so-leitor" />
                <Icone size={22} aria-hidden />
                {rotulo}
                <Check size={20} className="marcado" aria-hidden />
              </label>
            );
          })}
        </div>
        <MensagemDeErro id="erro-categoria" texto={erros.categoria} />
        <p className="apoio">Não achou o seu tipo? Escolha Outra ajuda e explique na descrição.</p>
      </section>

      <section className="cartao">
        <h2 className="rotulo">3. Quando</h2>
        <div className="dois-campos">
          <label className="campo">
            Data
            <input
              name="data"
              type="date"
              className="entrada"
              aria-invalid={erros.dataEHora ? true : undefined}
              aria-describedby={erros.dataEHora ? "erro-quando" : undefined}
              onChange={(evento) => setTemData(evento.target.value !== "")}
            />
            {!temData && <span className="apoio">{TOQUE_PARA_ESCOLHER}</span>}
          </label>
          <label className="campo">
            Horário
            <input
              name="horario"
              type="time"
              className="entrada"
              aria-invalid={erros.dataEHora ? true : undefined}
              aria-describedby={erros.dataEHora ? "erro-quando" : undefined}
              onChange={(evento) => setTemHorario(evento.target.value !== "")}
            />
            {!temHorario && <span className="apoio">{TOQUE_PARA_ESCOLHER}</span>}
          </label>
        </div>
        <MensagemDeErro id="erro-quando" texto={erros.dataEHora} />
      </section>

      <p className="nota">
        <Info size={20} aria-hidden />
        Seu nome, unidade e telefone só aparecem para quem aceitar. Não vale pedir: serviços pagos, dinheiro,
        orientação médica, transporte de pessoas, cuidado de crianças, nem nada arriscado ou que precise de
        profissional. Em emergência, ligue 192 ou 193.
      </p>

      {aviso && (
        <p role="alert" className="linha">
          <Info size={22} aria-hidden />
          {aviso}
        </p>
      )}

      <div className="rodape">
        <button type="submit" className="botao botao-principal" disabled={enviando}>
          {enviando ? "Publicando…" : "Publicar pedido"}
        </button>
      </div>
    </form>
  );
}

// Tela 4 de criar-e-aceitar: pedido publicado.

export function Publicado({ resumo, agora, aoVoltar }: { resumo: ResumoDoPedido; agora: Date; aoVoltar: () => void }) {
  return (
    <div className="tela centro">
      <span className="circulo circulo-bom">
        <Check size={36} aria-hidden />
      </span>
      <h1 className="titulo-tela">Pedido publicado</h1>
      <p className="apoio">
        Ele já aparece para os vizinhos. Quem oferece essa ajuda e está disponível no horário recebe um aviso.
      </p>
      <section className="cartao">
        <div className="pessoa">
          <IconeDaCategoria categoria={resumo.categoria} />
          <div className="cartao-texto">
            <span className="cartao-selos">
              <Selo status={resumo.status} />
            </span>
            <h2 className="titulo-cartao">{resumo.titulo}</h2>
          </div>
        </div>
        <div className="divisor" />
        <LinhasDoPedido pedido={resumo} agora={agora} comCategoria />
      </section>
      <div className="rodape">
        <button type="button" className="botao botao-principal" onClick={aoVoltar}>
          Voltar ao início
        </button>
      </div>
    </div>
  );
}

function LinhasDoPedido({
  pedido,
  agora,
  comCategoria,
}: {
  pedido: Pick<Pedido, "categoria" | "data_e_hora">;
  agora: Date;
  comCategoria?: boolean;
}) {
  return (
    <ul className="linhas">
      <li className="linha">
        <Clock size={20} aria-hidden />
        {dataLonga(pedido.data_e_hora, agora)}
      </li>
      {comCategoria && (
        <li className="linha">
          <Tag size={20} aria-hidden />
          {tipoDeAjuda(pedido.categoria).rotulo}
        </li>
      )}
    </ul>
  );
}

// Detalhe do pedido: tela 5 de criar-e-aceitar, telas 2 e 3 de meus-pedidos e tela 2 de eu-ajudo.

type NotaDoDetalhe = { Icone: LucideIcon; texto: string };

const CONTATOS_SO_ENQUANTO_ACEITO = "Os contatos ficam visíveis só enquanto o pedido estiver aceito.";

function notaDoDetalhe(pedido: Pedido, horarioPassou: boolean): NotaDoDetalhe | null {
  if (pedido.ehMeu && pedido.status === "aberta") {
    return {
      Icone: Bell,
      texto: horarioPassou
        ? "O horário passou e ninguém aceitou. Você pode cancelar o pedido."
        : "Ninguém aceitou ainda. O pedido aparece para os vizinhos da comunidade.",
    };
  }
  if (pedido.ehMeu && pedido.status === "aceita") {
    return {
      Icone: Lock,
      texto: `${CONTATOS_SO_ENQUANTO_ACEITO} A ajuda já foi feita? Toque em Concluir${horarioPassou ? "." : ", mesmo antes do horário."}`,
    };
  }
  if (pedido.souApoiador && pedido.status === "aceita") {
    return {
      Icone: Lock,
      texto: `${CONTATOS_SO_ENQUANTO_ACEITO} ${horarioPassou ? "Quem pediu precisa concluir o pedido." : "Depois da ajuda, quem pediu conclui o pedido."}`,
    };
  }
  if (pedido.status === "aberta") {
    return { Icone: Lock, texto: "O nome, a unidade e o telefone de quem pediu aparecem depois que você aceitar." };
  }
  return null;
}

export function Detalhe({
  pedido,
  agora,
  aoVoltar,
  aoPedir,
}: {
  pedido: Pedido | undefined;
  agora: Date;
  aoVoltar: () => void;
  aoPedir: (acao: Acao, pedido: Pedido) => void;
}) {
  if (!pedido) {
    return (
      <div className="tela centro">
        <span className="circulo">
          <CircleAlert size={36} aria-hidden />
        </span>
        <h1 className="titulo-tela">Este pedido não existe mais.</h1>
        <div className="rodape">
          <button type="button" className="botao botao-principal" onClick={aoVoltar}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const rotulo = rotuloDoPedido(pedido, agora);
  const nota = notaDoDetalhe(pedido, rotulo !== null);
  const aceita = pedido.status === "aceita";
  // DT-11, DT-21: Aceitar e Concluir no botão principal; Cancelar e Desistir no neutro. DT-22: quem ajuda não conclui.
  const acoes: { acao: Acao; texto: string; principal?: boolean }[] = pedido.ehMeu
    ? [
        ...(aceita ? [{ acao: "concluir" as const, texto: "Concluir", principal: true }] : []),
        ...(aceita || pedido.status === "aberta" ? [{ acao: "cancelar" as const, texto: "Cancelar pedido" }] : []),
      ]
    : pedido.souApoiador
      ? aceita
        ? [{ acao: "desistir", texto: "Desistir" }]
        : []
      : pedido.status === "aberta"
        ? [{ acao: "aceitar", texto: "Aceitar", principal: true }]
        : [];

  return (
    <div className="tela">
      <BotaoVoltar aoVoltar={aoVoltar} />
      <div className="pessoa">
        <IconeDaCategoria categoria={pedido.categoria} tamanho="grande" />
        {/* DT-23: o rótulo de quem ajuda fica abaixo do selo; o de quem pediu, ao lado. */}
        <div className={pedido.souApoiador ? "linhas" : "cartao-selos"}>
          <span className="cartao-selos">
            <Selo status={pedido.status} />
          </span>
          {rotulo && (
            <span className="cartao-selos">
              <Aviso rotulo={rotulo} />
            </span>
          )}
        </div>
      </div>
      <h1 className="titulo-tela">{pedido.titulo}</h1>

      {aceita ? (
        <LinhasDoPedido pedido={pedido} agora={agora} />
      ) : (
        <section className="cartao">
          <LinhasDoPedido pedido={pedido} agora={agora} comCategoria />
        </section>
      )}

      {!(pedido.ehMeu && aceita) && (
        <section>
          <h2 className="rotulo">Descrição</h2>
          <p>{pedido.descricao}</p>
        </section>
      )}

      {pedido.contato && (
        <CartaoDoContato titulo={pedido.ehMeu ? "Quem vai ajudar" : "Quem pediu"} contato={pedido.contato} />
      )}

      {nota && (
        <p className="nota">
          <nota.Icone size={20} aria-hidden />
          {nota.texto}
        </p>
      )}

      {acoes.length > 0 && (
        <div className="rodape rodape-com-linha">
          {acoes.map(({ acao, texto, principal }) => (
            <button
              key={acao}
              type="button"
              className={`botao ${principal ? "botao-principal" : "botao-secundario"}`}
              onClick={() => aoPedir(acao, pedido)}
            >
              {texto}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Confirmações em tela inteira (DT-01, DT-12, DT-21): tela 6 de criar-e-aceitar,
// telas 4 e 6 de meus-pedidos e tela 3 de eu-ajudo.

type LinhaAoConfirmar = { Icone: LucideIcon; texto: string };

const DEIXAM_DE_VER: LinhaAoConfirmar = { Icone: Lock, texto: "Vocês dois deixam de ver o contato um do outro." };

function confirmacaoDa(acao: Acao, pedido: Pedido): { pergunta: string; linhas: LinhaAoConfirmar[] } {
  if (acao === "aceitar") {
    return {
      pergunta: "Aceitar este pedido?",
      linhas: [
        { Icone: Eye, texto: "Você passa a ver o nome, a unidade e o telefone de quem pediu." },
        { Icone: Users, texto: "Quem pediu passa a ver o seu nome, unidade e telefone." },
        { Icone: Lock, texto: "Os contatos ficam visíveis só enquanto o pedido estiver aceito." },
        { Icone: Bell, texto: "Quem pediu recebe um aviso de que você aceitou." },
      ],
    };
  }
  if (acao === "cancelar") {
    return {
      pergunta: "Cancelar este pedido?",
      linhas: [
        { Icone: CircleX, texto: "O pedido é cancelado e não pode ser reaberto." },
        // DT-17: sem apoiador, não há quem avisar nem contato a esconder.
        ...(pedido.status === "aceita"
          ? [{ Icone: Bell, texto: "Quem ia ajudar recebe um aviso." }, DEIXAM_DE_VER]
          : []),
      ],
    };
  }
  if (acao === "concluir") {
    return {
      pergunta: "A ajuda já foi feita?",
      linhas: [
        { Icone: CircleCheck, texto: "O pedido é concluído e não muda mais." },
        { Icone: Bell, texto: "Quem ajudou recebe um aviso." },
        DEIXAM_DE_VER,
      ],
    };
  }
  return {
    pergunta: "Desistir deste pedido?",
    linhas: [
      { Icone: RotateCcw, texto: "O pedido volta a ficar aberto, e você deixa de ser quem vai ajudar." },
      { Icone: Bell, texto: "Quem pediu recebe um aviso." },
      DEIXAM_DE_VER,
    ],
  };
}

function TelaDeConfirmacao({
  icone,
  pergunta,
  children,
  linhas,
  ocupado,
  aoConfirmar,
  aoVoltar,
}: {
  icone: React.ReactNode;
  pergunta: string;
  children?: React.ReactNode;
  linhas: LinhaAoConfirmar[];
  ocupado: boolean;
  aoConfirmar: () => void;
  aoVoltar: () => void;
}) {
  return (
    <div className="tela centro">
      {icone}
      <h1 className="titulo-tela">{pergunta}</h1>
      {children}
      <section className="cartao">
        <h2 className="rotulo">Ao confirmar</h2>
        <ul className="linhas linhas-ao-confirmar">
          {linhas.map(({ Icone, texto }) => (
            <li key={texto} className="linha">
              <Icone size={22} aria-hidden />
              {texto}
            </li>
          ))}
        </ul>
      </section>
      <div className="rodape">
        {/* DT-15: Confirmar usa o botão principal, também ao cancelar e ao desistir. */}
        <button type="button" className="botao botao-principal" disabled={ocupado} onClick={aoConfirmar}>
          Confirmar
        </button>
        <button type="button" className="botao botao-secundario" disabled={ocupado} onClick={aoVoltar}>
          Voltar
        </button>
      </div>
    </div>
  );
}

export function Confirmar({
  acao,
  pedido,
  agora,
  ocupado,
  aoConfirmar,
  aoVoltar,
}: {
  acao: Acao;
  // O pedido como a tela mostrava quando a pessoa pediu a ação (RF-CS-36).
  pedido: Pedido;
  agora: Date;
  ocupado: boolean;
  aoConfirmar: () => void;
  aoVoltar: () => void;
}) {
  const { pergunta, linhas } = confirmacaoDa(acao, pedido);
  return (
    <TelaDeConfirmacao
      icone={<IconeDaCategoria categoria={pedido.categoria} tamanho="maior" />}
      pergunta={pergunta}
      linhas={linhas}
      ocupado={ocupado}
      aoConfirmar={aoConfirmar}
      aoVoltar={aoVoltar}
    >
      <p className="apoio">
        {pedido.titulo}
        <br />
        {dataLonga(pedido.data_e_hora, agora)}
      </p>
    </TelaDeConfirmacao>
  );
}

export function ConfirmarLimpeza({
  ocupado,
  aoConfirmar,
  aoVoltar,
}: {
  ocupado: boolean;
  aoConfirmar: () => void;
  aoVoltar: () => void;
}) {
  return (
    <TelaDeConfirmacao
      icone={
        <span className="icone-categoria icone-maior">
          <Trash2 size={32} aria-hidden />
        </span>
      }
      pergunta="Limpar a demonstração?"
      linhas={[
        { Icone: CircleX, texto: "Todos os pedidos da demonstração são apagados." },
        { Icone: Smartphone, texto: "A lista fica vazia nos dois celulares." },
      ]}
      ocupado={ocupado}
      aoConfirmar={aoConfirmar}
      aoVoltar={aoVoltar}
    />
  );
}

// Telas de resultado e de recusa: telas 7 e 8 de criar-e-aceitar, 5, 7 e 8 de meus-pedidos,
// 4 e 5 de eu-ajudo, e as exceções sem tela própria dos três documentos.

type TelaDeResultado = {
  Icone: LucideIcon;
  bom?: boolean;
  titulo: string;
  texto?: string;
  botao: string;
  destino: Destino;
  // Resultado de sucesso: cartão com a data por extenso e botão neutro.
  sucesso?: boolean;
  semSelo?: boolean;
  semCartao?: boolean;
};

const VER_MEUS_PEDIDOS = { botao: "Ver meus pedidos", destino: "meus" } as const;
const VER_O_PEDIDO = { botao: "Ver o pedido", destino: "detalhe" } as const;
const NADA_A_FAZER = "Você não precisa fazer mais nada.";

function sucessoDa(acao: Acao, antes: Pedido): TelaDeResultado {
  if (acao === "aceitar") {
    return {
      Icone: Check,
      bom: true,
      titulo: "Você aceitou o pedido",
      texto: "Quem pediu já foi avisado.",
      botao: "Voltar ao início",
      destino: "inicio",
      sucesso: true,
    };
  }
  if (acao === "cancelar") {
    return {
      Icone: X,
      titulo: "Pedido cancelado",
      // Só quando havia apoiador.
      texto: antes.status === "aceita" ? "Quem ia ajudar já foi avisado." : undefined,
      ...VER_MEUS_PEDIDOS,
      sucesso: true,
    };
  }
  if (acao === "concluir") {
    return {
      Icone: Check,
      bom: true,
      titulo: "Pedido concluído",
      texto: "Quem ajudou já foi avisado.",
      ...VER_MEUS_PEDIDOS,
      sucesso: true,
    };
  }
  return {
    Icone: RotateCcw,
    titulo: "Você desistiu do pedido",
    texto: "Quem pediu já foi avisado. O pedido voltou a ficar aberto.",
    ...VER_MEUS_PEDIDOS,
    sucesso: true,
  };
}

function recusaDa(acao: Acao, motivo: string, atual: Pedido | undefined): TelaDeResultado {
  const Icone = CircleAlert;
  if (motivo === "nao_encontrado" || !atual) {
    return { Icone, titulo: "Este pedido não existe mais.", botao: "Voltar ao início", destino: "inicio", semCartao: true };
  }
  const encerrado: TelaDeResultado | null =
    atual.status === "concluida"
      ? { Icone, titulo: "Este pedido foi concluído", ...VER_MEUS_PEDIDOS }
      : atual.status === "cancelada"
        ? { Icone, titulo: "Este pedido foi cancelado", ...VER_MEUS_PEDIDOS }
        : null;

  if (acao === "aceitar") {
    if (motivo === "ja_aceita") {
      return {
        Icone: UserCheck,
        titulo: "Este pedido já foi aceito",
        texto: "Outro vizinho aceitou antes de você. Nada mudou para você.",
        botao: "Ver outros pedidos",
        destino: "inicio",
        semSelo: true,
      };
    }
    if (motivo === "ja_e_o_apoiador") return { Icone, titulo: "Você já aceitou este pedido.", ...VER_O_PEDIDO };
    if (motivo === "encerrada") {
      return { Icone, titulo: "Este pedido foi encerrado.", botao: "Ver outros pedidos", destino: "inicio" };
    }
    if (motivo === "proprio_solicitante") {
      return {
        Icone,
        titulo: "Este pedido é seu",
        texto: "Acompanhe em Meus pedidos.",
        botao: "Ir para Meus pedidos",
        destino: "meus",
      };
    }
  }

  if (acao === "desistir") {
    if (motivo === "nao_e_o_apoiador") {
      return {
        Icone,
        titulo: "Este pedido não está mais com você",
        texto: `Outro vizinho aceitou depois da sua desistência. ${NADA_A_FAZER}`,
        ...VER_MEUS_PEDIDOS,
      };
    }
    if (motivo === "nao_esta_aceita" && encerrado) {
      const quem = atual.status === "concluida" ? "concluiu" : "cancelou";
      return { ...encerrado, texto: `Quem pediu ${quem} antes da sua desistência. ${NADA_A_FAZER}` };
    }
    if (motivo === "nao_esta_aceita") {
      return {
        Icone,
        titulo: "Você já tinha desistido deste pedido",
        texto: `A desistência já foi registrada. ${NADA_A_FAZER}`,
        ...VER_MEUS_PEDIDOS,
      };
    }
  }

  if (acao === "concluir") {
    if (motivo === "apoiador_mudou") {
      return {
        Icone,
        titulo: "Quem vai ajudar mudou",
        texto: "A pessoa que tinha aceitado desistiu, e outro vizinho aceitou. O pedido não foi concluído.",
        ...VER_O_PEDIDO,
      };
    }
    if (motivo === "ninguem_aceitou") {
      return {
        Icone,
        titulo: "Quem ia ajudar desistiu",
        texto: "Quem tinha aceitado desistiu. O pedido voltou a ficar aberto e não foi concluído.",
        ...VER_O_PEDIDO,
      };
    }
  }

  if (motivo === "encerrada" && encerrado) return encerrado;
  if (motivo === "mudou") {
    return { Icone, titulo: "Este pedido mudou", texto: "A tela foi atualizada.", ...VER_O_PEDIDO };
  }
  return { Icone, titulo: MOTIVOS[motivo] ?? ALGO_DEU_ERRADO, ...VER_O_PEDIDO };
}

export function Resultado({
  acao,
  motivo,
  antes,
  atual,
  agora,
  aoSair,
}: {
  acao: Acao;
  // null quando a ação deu certo.
  motivo: string | null;
  antes: Pedido;
  atual: Pedido | undefined;
  agora: Date;
  aoSair: (destino: Destino) => void;
}) {
  const tela = motivo === null ? sucessoDa(acao, antes) : recusaDa(acao, motivo, atual);
  const pedido = atual ?? antes;
  return (
    <div className="tela centro">
      <span className={tela.bom ? "circulo circulo-bom" : "circulo"}>
        <tela.Icone size={36} aria-hidden />
      </span>
      <h1 className="titulo-tela">{tela.titulo}</h1>
      {tela.texto && <p className={tela.sucesso ? "apoio" : undefined}>{tela.texto}</p>}
      {!tela.semCartao && (
        <CartaoDoPedido pedido={pedido} agora={agora} comSelo={!tela.semSelo} soData={tela.sucesso} />
      )}
      {/* Tela 7 de criar-e-aceitar: o contato de quem pediu, só para quem aceitou (P-04). */}
      {motivo === null && acao === "aceitar" && atual?.contato && (
        <CartaoDoContato titulo="Quem pediu" contato={atual.contato} />
      )}
      <div className="rodape">
        <button
          type="button"
          className={`botao ${tela.sucesso ? "botao-secundario" : "botao-principal"}`}
          onClick={() => aoSair(tela.destino)}
        >
          {tela.botao}
        </button>
      </div>
    </div>
  );
}

// Meus pedidos: tela 1 de meus-pedidos (aba "Eu pedi") e tela 1 de eu-ajudo (aba "Eu ajudo").

export type AbaDeMeusPedidos = "pedi" | "ajudo";

const ABAS: { aba: AbaDeMeusPedidos; texto: string; vazio: string }[] = [
  { aba: "pedi", texto: "Eu pedi", vazio: "Você ainda não pediu nenhuma ajuda." },
  { aba: "ajudo", texto: "Eu ajudo", vazio: "Você ainda não aceitou nenhum pedido." },
];

export function MeusPedidos({
  pedidos,
  agora,
  aba,
  aoMudarAba,
  aoAbrir,
  aoCancelar,
}: {
  pedidos: Pedido[] | null;
  agora: Date;
  aba: AbaDeMeusPedidos;
  aoMudarAba: (aba: AbaDeMeusPedidos) => void;
  aoAbrir: (id: string) => void;
  aoCancelar: (pedido: Pedido) => void;
}) {
  // DT-19: quem desistiu deixa de ser apoiador, e o pedido sai de "Eu ajudo".
  const daAba = (pedidos ?? [])
    .filter((pedido) => (aba === "pedi" ? pedido.ehMeu : pedido.souApoiador))
    .map((pedido) => ({ pedido, rotulo: rotuloDoPedido(pedido, agora) }));
  // DT-10: ativos em cima, com os pedidos que têm rótulo primeiro; encerrados embaixo.
  const ativos = daAba
    .filter(({ pedido }) => pedido.status === "aberta" || pedido.status === "aceita")
    .sort((a, b) => Number(b.rotulo !== null) - Number(a.rotulo !== null));
  const encerrados = daAba.filter(({ pedido }) => pedido.status === "concluida" || pedido.status === "cancelada");

  // Abas com as teclas de seta (RNF-US-11).
  function aoTeclar(evento: React.KeyboardEvent<HTMLDivElement>) {
    if (evento.key !== "ArrowLeft" && evento.key !== "ArrowRight") return;
    const outra = aba === "pedi" ? "ajudo" : "pedi";
    aoMudarAba(outra);
    evento.currentTarget.querySelector<HTMLElement>(`#aba-${outra}`)?.focus();
  }

  const secao = (titulo: string, itens: typeof daAba) =>
    itens.length > 0 && (
      <section className="lista">
        <h2 className="titulo-secao">{titulo}</h2>
        {itens.map(({ pedido, rotulo }) => (
          <CartaoDoPedido
            key={pedido.id}
            pedido={pedido}
            agora={agora}
            aoAbrir={() => aoAbrir(pedido.id)}
            avisoAoLado={rotulo === "falta_concluir" ? rotulo : null}
          >
            {/* DT-23: rótulos longos ficam no rodapé do cartão; o de horário vencido traz o Cancelar. */}
            {rotulo && rotulo !== "falta_concluir" && (
              <div className="cartao-rodape">
                <Aviso rotulo={rotulo} />
                {rotulo === "horario_passou_ninguem_aceitou" && (
                  <button type="button" className="botao botao-secundario botao-menor" onClick={() => aoCancelar(pedido)}>
                    Cancelar
                  </button>
                )}
              </div>
            )}
          </CartaoDoPedido>
        ))}
      </section>
    );

  return (
    <div className="tela tela-com-barra">
      <h1 className="titulo-tela">Meus pedidos</h1>
      <div role="tablist" className="abas" aria-label="Meus pedidos" onKeyDown={aoTeclar}>
        {ABAS.map(({ aba: item, texto }) => (
          <button
            key={item}
            id={`aba-${item}`}
            type="button"
            role="tab"
            className="aba"
            aria-selected={item === aba}
            aria-controls="painel-de-pedidos"
            tabIndex={item === aba ? 0 : -1}
            onClick={() => aoMudarAba(item)}
          >
            {texto}
          </button>
        ))}
      </div>
      <div id="painel-de-pedidos" role="tabpanel" className="lista" aria-labelledby={`aba-${aba}`}>
        {pedidos === null && <p className="apoio">Carregando…</p>}
        {pedidos !== null && daAba.length === 0 && (
          <p className="apoio">{ABAS.find((item) => item.aba === aba)?.vazio}</p>
        )}
        {secao("Ativos", ativos)}
        {secao("Encerrados", encerrados)}
      </div>
    </div>
  );
}

// Perfil: sem mockup (DT-05). Na demonstração, mostra o morador e as ações da própria demonstração.

export function Perfil({
  morador,
  aoSair,
  aoLimpar,
}: {
  morador: Morador;
  aoSair: () => void;
  aoLimpar: () => void;
}) {
  return (
    <div className="tela tela-com-barra">
      <h1 className="titulo-tela">Perfil</h1>
      <section className="cartao">
        <div className="pessoa">
          <span className="avatar avatar-cheio">
            <User size={24} aria-hidden />
          </span>
          <div>
            <p className="nome">{morador.nome}</p>
            <p className="apoio">{morador.unidade}</p>
            <p className="apoio">{morador.telefone}</p>
          </div>
        </div>
      </section>
      <p className="nota">
        <Info size={20} aria-hidden />
        Demonstração · dados de teste do grupo
      </p>
      <button type="button" className="botao botao-secundario" onClick={aoSair}>
        Sair
      </button>
      <button type="button" className="botao botao-secundario" onClick={aoLimpar}>
        Limpar demonstração
      </button>
    </div>
  );
}
