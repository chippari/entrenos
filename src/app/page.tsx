// Página inicial pública: apresenta o projeto com telas dos mockups (docs/mockups/).
// Só visual, sem regra de negócio. Todo texto importante está escrito na página, não só nas imagens.
import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  Building2,
  EyeOff,
  HeartHandshake,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserCheck,
  X,
  type LucideIcon,
} from "lucide-react";
// A identidade visual (cores dos dois temas, foco da RU-01, botões e link) é a mesma da demonstração:
// as regras de demo.css valem dentro da classe "demo".
import "./demo/demo.css";
import "./inicio.css";
// Os sete tipos de ajuda, com os mesmos nomes e ícones da demonstração (D-03).
import { TIPOS_DE_AJUDA } from "./demo/pecas";

const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  weight: ["400", "700"],
  // Fonte de reserva: a sem serifa do sistema. O Next não tem as medidas desta fonte para ajustar a reserva.
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "EntreNós · vizinhos que se ajudam",
  description: "Pequenas ajudas entre vizinhos da mesma comunidade",
};

const ANCORAS = [
  { href: "#como-funciona", texto: "Como funciona" },
  { href: "#privacidade", texto: "Privacidade" },
  { href: "#comunidades", texto: "Para comunidades" },
];

type Tela = { src: string; altura: number; alt: string };

// Largura real das imagens dos mockups; a altura real vem em cada tela.
const LARGURA_DA_TELA = 390;

const TELA_INICIAL: Tela = {
  src: "/mockups/criar-e-aceitar/01-inicio.png",
  altura: 844,
  alt: "Tela inicial do aplicativo, com o botão Pedir ajuda e a lista de pedidos abertos dos vizinhos",
};

const PASSOS: { titulo: string; frase: string; tela: Tela }[] = [
  {
    titulo: "Pedir",
    frase: "Diga do que precisa, escolha o tipo de ajuda e marque o dia e o horário.",
    tela: {
      src: "/mockups/criar-e-aceitar/02-criar.png",
      altura: 1240,
      alt: "Formulário Pedir ajuda, com o título, a descrição e os tipos de ajuda para escolher",
    },
  },
  {
    titulo: "Aceitar",
    frase: "Um vizinho lê o pedido e aceita. Antes de confirmar, ele vê o que vai acontecer.",
    tela: {
      src: "/mockups/criar-e-aceitar/06-confirmar.png",
      altura: 844,
      alt: "Tela com a pergunta Aceitar este pedido, o que acontece ao confirmar e os botões Confirmar e Voltar",
    },
  },
  {
    titulo: "Combinar e concluir",
    frase: "Os dois combinam por telefone. Depois da ajuda, quem pediu conclui o pedido.",
    tela: {
      src: "/mockups/meus-pedidos/03-meu-pedido-aceito.png",
      altura: 844,
      alt: "Pedido aceito, com o contato de quem vai ajudar, o botão para ligar e os botões Concluir e Cancelar pedido",
    },
  },
];

const ETAPAS_DA_PRIVACIDADE: { frase: string; Icone: LucideIcon }[] = [
  { frase: "Antes do aceite, ninguém vê quem pediu.", Icone: EyeOff },
  { frase: "Depois do aceite, quem pediu e quem ajuda veem o contato um do outro.", Icone: UserCheck },
  { frase: "Quando termina, o contato some.", Icone: LockKeyhole },
];

const ANTES_E_DEPOIS: { legenda: string; tela: Tela }[] = [
  {
    legenda: "Antes do aceite",
    tela: {
      src: "/mockups/criar-e-aceitar/05-pedido.png",
      altura: 844,
      alt: "Detalhe de um pedido aberto, sem nome, unidade nem telefone de quem pediu, com o botão Aceitar",
    },
  },
  {
    legenda: "Depois do aceite",
    tela: {
      src: "/mockups/criar-e-aceitar/07-aceito.png",
      altura: 844,
      alt: "Pedido aceito, agora com o nome, a unidade e o botão para ligar para quem pediu",
    },
  },
];

const FICA_DE_FORA = ["Serviços pagos", "Dinheiro", "Saúde", "Transporte de pessoas", "Emergências"];

// Entrada de uma comunidade na rede: o cadastro ainda está em construção, então a página só explica.
const PASSOS_DA_COMUNIDADE: { titulo: string; frase: string; Icone: LucideIcon }[] = [
  {
    titulo: "Cadastre a comunidade",
    frase: "Nome, endereço e um documento que comprove a responsabilidade.",
    Icone: Building2,
  },
  {
    titulo: "Aprovação",
    frase: "A equipe do EntreNós confere o cadastro e libera a comunidade.",
    Icone: ShieldCheck,
  },
  {
    titulo: "Convide os moradores",
    frase: "Cada morador recebe um convite por e-mail, de uso único, que vale 7 dias.",
    Icone: Mail,
  },
];

// Marca provisória, até existir o logo da decisão V6 (docs/design/identidade-visual.md).
function Marca() {
  return (
    <p className="marca nome-do-app">
      <span className="simbolo">
        <HeartHandshake size={24} aria-hidden />
      </span>
      EntreNós
    </p>
  );
}

// Moldura de celular feita em CSS, com uma tela dos mockups dentro e um círculo decorativo atrás.
function Celular({ tela, sizes, logoNoInicio }: { tela: Tela; sizes: string; logoNoInicio?: boolean }) {
  return (
    <div className="palco">
      <div className="celular">
        <Image
          src={tela.src}
          width={LARGURA_DA_TELA}
          height={tela.altura}
          alt={tela.alt}
          sizes={sizes}
          loading={logoNoInicio ? "eager" : "lazy"}
        />
      </div>
    </div>
  );
}

// Abertura de cada seção: rótulo pequeno em caixa alta, título e, se houver, um texto de introdução.
function Cabeca({
  id,
  etiqueta,
  titulo,
  children,
}: {
  id: string;
  etiqueta: string;
  titulo: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="cabeca">
      <p className="etiqueta">{etiqueta}</p>
      <h2 id={id} className="titulo-da-secao">
        {titulo}
      </h2>
      {children}
    </div>
  );
}

export default function PaginaInicial() {
  return (
    <div className={`demo inicio ${atkinson.className}`}>
      <header className="topo">
        <div className="largura topo-conteudo">
          <Marca />
          <div className="topo-direita">
            <nav className="navegacao" aria-label="Seções da página">
              {ANCORAS.map(({ href, texto }) => (
                <a key={href} href={href} className="ancora">
                  {texto}
                </a>
              ))}
            </nav>
            <Link href="/demo" className="botao botao-principal entrar">
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="faixa faixa-cartao">
          <div className="largura abertura">
            <div className="abertura-texto">
              <p className="etiqueta">Rede de ajuda entre vizinhos</p>
              <h1 className="titulo-da-pagina">Vizinhos que se ajudam, do jeito simples.</h1>
              <p className="subtitulo">
                Pequenas ajudas entre moradores da mesma comunidade, com privacidade e sem complicação.
              </p>
              <div className="botoes">
                <Link href="/demo" className="botao botao-principal">
                  Entrar
                </Link>
                <a href="#como-funciona" className="botao botao-secundario">
                  Como funciona
                  <ArrowDown size={20} aria-hidden />
                </a>
              </div>
              <ul className="chips" aria-label="Tipos de ajuda">
                {Object.values(TIPOS_DE_AJUDA).map(({ rotulo, Icone }) => (
                  <li key={rotulo} className="chip">
                    <Icone size={18} aria-hidden />
                    {rotulo}
                  </li>
                ))}
              </ul>
            </div>
            <Celular tela={TELA_INICIAL} sizes="320px" logoNoInicio />
          </div>
        </section>

        <section id="como-funciona" className="faixa" aria-labelledby="titulo-como-funciona">
          <div className="largura">
            <Cabeca id="titulo-como-funciona" etiqueta="Como funciona" titulo="Pedir ajuda em três passos">
              <p className="introducao">Quem precisa pede; um vizinho aceita; os dois combinam.</p>
            </Cabeca>
            <ol className="passos-alternados">
              {PASSOS.map(({ titulo, frase, tela }, indice) => (
                <li key={titulo} className="passo-linha">
                  <div className="passo-texto">
                    {/* Decorativo: a ordem já vem da lista numerada. */}
                    <span className="numero-grande" aria-hidden>
                      {String(indice + 1).padStart(2, "0")}
                    </span>
                    <h3 className="titulo-do-passo">{titulo}</h3>
                    <p className="texto-maior">{frase}</p>
                  </div>
                  <Celular tela={tela} sizes="300px" />
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="privacidade" className="faixa faixa-cartao" aria-labelledby="titulo-privacidade">
          <div className="largura">
            <Cabeca id="titulo-privacidade" etiqueta="Privacidade" titulo="Quem pediu só aparece para quem aceitou" />
            <ul className="grade-de-3">
              {ETAPAS_DA_PRIVACIDADE.map(({ frase, Icone }) => (
                <li key={frase} className="cartao-da-pagina cartao-invertido">
                  <span className="ladrilho">
                    <Icone size={28} aria-hidden />
                  </span>
                  <p className="texto-maior">{frase}</p>
                </li>
              ))}
            </ul>
            <div className="duas-telas">
              {ANTES_E_DEPOIS.map(({ legenda, tela }) => (
                <figure key={legenda} className="tela-com-legenda">
                  <Celular tela={tela} sizes="(max-width: 899px) 45vw, 260px" />
                  <figcaption>{legenda}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="faixa" aria-labelledby="titulo-telegram">
          <div className="largura duas-colunas">
            <Cabeca id="titulo-telegram" etiqueta="Telegram" titulo="Também pelo Telegram">
              <p className="introducao">
                O bot do EntreNós avisa dos pedidos novos e deixa agir na própria conversa, sem abrir o site.
              </p>
              <p className="em-construcao">Em construção</p>
            </Cabeca>
            {/* Conversa de exemplo, desenhada em CSS: os "botões" são só desenho, não recebem foco nem clique. */}
            <figure className="conversa" aria-label="Exemplo de mensagem do bot do EntreNós no Telegram">
              <p className="conversa-topo">
                <span className="simbolo simbolo-menor">
                  <HeartHandshake size={18} aria-hidden />
                </span>
                EntreNós
                <span className="conversa-tipo">bot</span>
              </p>
              <p className="balao">
                Novo pedido na sua comunidade: Regar plantas, sábado às 9h. Abra o EntreNós para ver.
              </p>
              <p className="botoes-desenhados">
                <span className="botao-desenhado">Ver pedido</span>
                <span className="botao-desenhado">Depois</span>
              </p>
            </figure>
          </div>
        </section>

        <section className="faixa faixa-cartao" aria-labelledby="titulo-fora">
          <div className="largura duas-colunas">
            <Cabeca id="titulo-fora" etiqueta="O que fica de fora" titulo="Ajuda pequena, de vizinho">
              <p className="introducao">Em emergência, ligue 192 ou 193.</p>
            </Cabeca>
            <ul className="lista-de-fora">
              {FICA_DE_FORA.map((item) => (
                <li key={item}>
                  <span className="marca-de-fora">
                    <X size={20} aria-hidden />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="comunidades" className="faixa" aria-labelledby="titulo-comunidades">
          <div className="largura">
            <Cabeca id="titulo-comunidades" etiqueta="Para comunidades" titulo="Para quem cuida de uma comunidade">
              <p className="introducao">
                O EntreNós funciona por comunidade: um prédio, um condomínio ou uma vila. Quem responde pela
                comunidade cadastra e vira o administrador.
              </p>
            </Cabeca>
            <ol className="grade-de-3">
              {PASSOS_DA_COMUNIDADE.map(({ titulo, frase, Icone }, indice) => (
                <li key={titulo} className="cartao-da-pagina">
                  <span className="ladrilho">
                    <Icone size={28} aria-hidden />
                  </span>
                  <h3 className="titulo-do-cartao">
                    <span className="numero">{indice + 1}</span>
                    {titulo}
                  </h3>
                  <p>{frase}</p>
                </li>
              ))}
            </ol>
            <div className="depois-dos-passos">
              <p className="apoio">O administrador também pede e oferece ajuda, como qualquer morador.</p>
              {/* Abre o aviso logo abaixo, sem rota nova e sem JavaScript: o cadastro ainda não existe. */}
              <details className="aviso-de-cadastro">
                <summary className="botao botao-secundario">Quero cadastrar minha comunidade</summary>
                <p>O cadastro de comunidades ainda está em construção. Em breve, por aqui.</p>
              </details>
            </div>
          </div>
        </section>
      </main>

      <footer className="rodape-da-pagina">
        <div className="largura rodape-conteudo">
          <div className="rodape-texto">
            <Marca />
            <p>Projeto da disciplina Modelagem de Sistemas · Universidade Presbiteriana Mackenzie · 2026</p>
          </div>
          <nav className="rodape-links" aria-label="Links do rodapé">
            {ANCORAS.map(({ href, texto }) => (
              <a key={href} href={href} className="ancora">
                {texto}
              </a>
            ))}
            <Link href="/demo" className="link">
              Entrar
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
