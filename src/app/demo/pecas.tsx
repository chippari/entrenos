// Peças da demonstração: tipos, textos e componentes pequenos da identidade visual
// (docs/design/identidade-visual.md e docs/mockups/).
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Circle,
  Clock,
  Droplet,
  Ellipsis,
  Eye,
  House,
  List,
  Package,
  Phone,
  ShoppingBag,
  Smartphone,
  User,
  UserCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { FUSO_DA_SOLICITACAO } from "@/dominio/solicitacao/horario";
import { rotuloDaSolicitacao, type Rotulo } from "@/dominio/solicitacao/rotulo";
import type { Categoria } from "@/dominio/solicitacao/validacao";

export type Contato = { nome: string; unidade: string; telefone: string };

export type Status = "aberta" | "aceita" | "concluida" | "cancelada";

export type Pedido = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  data_e_hora: string;
  status: Status;
  ehMeu: boolean;
  souApoiador: boolean;
  apoiadorId: string | null;
  contato: Contato | null;
};

export type Acao = "aceitar" | "desistir" | "cancelar" | "concluir";

export type Aba = "inicio" | "meus" | "perfil";

export const MORADORES: Record<string, { artigo: string; nome: string; unidade: string }> = {
  ana: { artigo: "a", nome: "Ana", unidade: "Apto 12" },
  bruno: { artigo: "o", nome: "Bruno", unidade: "Apto 34" },
};

// Rótulos e ícones das sete categorias, como nos mockups (D-03).
export const TIPOS_DE_AJUDA: Record<Categoria, { rotulo: string; Icone: LucideIcon }> = {
  receber_encomendas: { rotulo: "Receber encomendas", Icone: Package },
  regar_plantas: { rotulo: "Regar plantas", Icone: Droplet },
  pequenas_compras: { rotulo: "Pequenas compras", Icone: ShoppingBag },
  auxilio_com_tecnologia: { rotulo: "Auxílio com tecnologia", Icone: Smartphone },
  companhia: { rotulo: "Companhia", Icone: Users },
  auxilio_visual: { rotulo: "Auxílio visual", Icone: Eye },
  outra_ajuda: { rotulo: "Outra ajuda", Icone: Ellipsis },
};

export function tipoDeAjuda(categoria: string) {
  return Object.hasOwn(TIPOS_DE_AJUDA, categoria)
    ? TIPOS_DE_AJUDA[categoria as Categoria]
    : { rotulo: categoria, Icone: Ellipsis };
}

// Tabela "Cores de status": cada status com o seu ícone e a sua palavra (RU-05).
const SELOS: Record<Status, { texto: string; Icone: LucideIcon }> = {
  aberta: { texto: "Aberta", Icone: Circle },
  aceita: { texto: "Aceita", Icone: UserCheck },
  concluida: { texto: "Concluída", Icone: Check },
  cancelada: { texto: "Cancelada", Icone: X },
};

export function Selo({ status }: { status: Status }) {
  const { texto, Icone } = SELOS[status];
  return (
    <span className={`selo selo-${status}`}>
      <Icone size={14} strokeWidth={2.5} aria-hidden />
      {texto}
    </span>
  );
}

// Textos aprovados dos rótulos de exibição (DT-13, DT-18). Rótulo não é status.
const TEXTOS_DOS_ROTULOS: Record<Rotulo, string> = {
  horario_passou_ninguem_aceitou: "Horário passou, ninguém aceitou",
  falta_concluir: "Falta concluir",
  aguardando_quem_pediu_concluir: "Aguardando quem pediu concluir",
};

export function Aviso({ rotulo }: { rotulo: Rotulo }) {
  return (
    <span className="selo selo-aviso">
      <Clock size={14} strokeWidth={2.5} aria-hidden />
      {TEXTOS_DOS_ROTULOS[rotulo]}
    </span>
  );
}

export function rotuloDoPedido(pedido: Pedido, agora: Date): Rotulo | null {
  const papel = pedido.ehMeu ? "solicitante" : pedido.souApoiador ? "apoiador" : "nenhum";
  return rotuloDaSolicitacao({ status: pedido.status, dataEHora: new Date(pedido.data_e_hora) }, papel, agora);
}

// Datas na hora de São Paulo (DEF-CS-01), nos dois formatos dos mockups.
const PARTES_DA_DATA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_DA_SOLICITACAO,
  hourCycle: "h23",
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
});

const DIA_NO_FUSO = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO_DA_SOLICITACAO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const UM_DIA = 24 * 60 * 60 * 1000;
const comMaiuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

function partesDaData(data: Date, agora: Date) {
  const partes = Object.fromEntries(PARTES_DA_DATA.formatToParts(data).map((parte) => [parte.type, parte.value]));
  const dia = DIA_NO_FUSO.format(data);
  const perto =
    dia === DIA_NO_FUSO.format(agora)
      ? "Hoje"
      : dia === DIA_NO_FUSO.format(new Date(agora.getTime() - UM_DIA))
        ? "Ontem"
        : null;
  const hora = `${Number(partes.hour)}h${partes.minute === "00" ? "" : partes.minute}`;
  return { weekday: partes.weekday, day: partes.day, month: partes.month, perto, hora };
}

// "Sáb, 7 nov, 9h" ou "Hoje, 18h".
export function dataCurta(dataEHora: string | Date, agora: Date): string {
  const { weekday, day, month, perto, hora } = partesDaData(new Date(dataEHora), agora);
  const dia = perto ?? `${comMaiuscula(weekday.slice(0, 3))}, ${Number(day)} ${month.slice(0, 3)}`;
  return `${dia}, ${hora}`;
}

// "Sábado, 7 de novembro, às 9h" ou "Hoje, 6 de novembro, às 18h".
export function dataLonga(dataEHora: string | Date, agora: Date): string {
  const { weekday, day, month, perto, hora } = partesDaData(new Date(dataEHora), agora);
  return `${perto ?? comMaiuscula(weekday)}, ${Number(day)} de ${month}, às ${hora}`;
}

export function IconeDaCategoria({ categoria, tamanho }: { categoria: string; tamanho?: "grande" | "maior" }) {
  const { Icone } = tipoDeAjuda(categoria);
  return (
    <span className={`icone-categoria ${tamanho ? `icone-${tamanho}` : ""}`}>
      <Icone size={tamanho === "maior" ? 32 : tamanho === "grande" ? 28 : 24} aria-hidden />
    </span>
  );
}

// Cartão de um pedido. Com `aoAbrir`, a linha inteira é um botão que leva ao detalhe (DT-03).
export function CartaoDoPedido({
  pedido,
  agora,
  aoAbrir,
  comSelo = true,
  avisoAoLado,
  soData,
  children,
}: {
  pedido: Pick<Pedido, "titulo" | "categoria" | "data_e_hora" | "status">;
  agora: Date;
  aoAbrir?: () => void;
  comSelo?: boolean;
  avisoAoLado?: Rotulo | null;
  // Telas de resultado: só a data por extenso, sem a categoria.
  soData?: boolean;
  children?: React.ReactNode;
}) {
  const conteudo = (
    <>
      <IconeDaCategoria categoria={pedido.categoria} />
      <span className="cartao-texto">
        {comSelo && (
          <span className="cartao-selos">
            <Selo status={pedido.status} />
            {avisoAoLado && <Aviso rotulo={avisoAoLado} />}
          </span>
        )}
        <span className="titulo-cartao">{pedido.titulo}</span>
        <span className="apoio">
          {soData
            ? dataLonga(pedido.data_e_hora, agora)
            : `${tipoDeAjuda(pedido.categoria).rotulo} · ${dataCurta(pedido.data_e_hora, agora)}`}
        </span>
      </span>
    </>
  );
  return (
    <article className="cartao-pedido">
      {aoAbrir ? (
        <button type="button" className="cartao-linha" onClick={aoAbrir}>
          {conteudo}
          <ChevronRight size={20} aria-hidden />
        </button>
      ) : (
        <div className="cartao-linha">{conteudo}</div>
      )}
      {children}
    </article>
  );
}

// Contato da outra parte, só enquanto o pedido estiver aceito (P-04, DC-10).
export function CartaoDoContato({ titulo, contato }: { titulo: string; contato: Contato }) {
  return (
    <section className="cartao">
      <h2 className="rotulo">{titulo}</h2>
      <div className="pessoa">
        <span className="avatar">
          <User size={24} aria-hidden />
        </span>
        <div>
          <p className="nome">{contato.nome}</p>
          <p className="apoio">{contato.unidade}</p>
        </div>
      </div>
      <a href={`tel:${contato.telefone.replace(/\D/g, "")}`} className="botao botao-principal botao-ligar">
        <Phone size={20} aria-hidden />
        Ligar para {contato.telefone}
      </a>
    </section>
  );
}

export function BotaoVoltar({ aoVoltar }: { aoVoltar: () => void }) {
  return (
    <button type="button" className="voltar" aria-label="Voltar" onClick={aoVoltar}>
      <ArrowLeft size={22} aria-hidden />
    </button>
  );
}

const ITENS_DA_BARRA: { aba: Aba; texto: string; Icone: LucideIcon }[] = [
  { aba: "inicio", texto: "Início", Icone: House },
  { aba: "meus", texto: "Meus pedidos", Icone: List },
  { aba: "perfil", texto: "Perfil", Icone: User },
];

// DT-05: barra de navegação embaixo. Só as telas principais mostram a barra (DT-24).
export function BarraDeNavegacao({ aba, aoMudar }: { aba: Aba; aoMudar: (aba: Aba) => void }) {
  return (
    <nav className="barra" aria-label="Áreas do aplicativo">
      <div className="barra-itens">
        {ITENS_DA_BARRA.map(({ aba: item, texto, Icone }) => (
          <button
            key={item}
            type="button"
            className="barra-item"
            aria-current={item === aba ? "page" : undefined}
            onClick={() => aoMudar(item)}
          >
            <Icone size={24} aria-hidden />
            {texto}
          </button>
        ))}
      </div>
    </nav>
  );
}
