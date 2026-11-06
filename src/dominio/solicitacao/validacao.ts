// Validação dos campos ao criar uma solicitação (RF-CS-03 a RF-CS-06; docs/specs/ciclo-da-solicitacao.md).
import { horarioPassou, lerDataEHoraLocal } from "@/dominio/solicitacao/horario";

// D-03 e DC-07: as sete categorias fixas.
export const CATEGORIAS = [
  "receber_encomendas",
  "regar_plantas",
  "pequenas_compras",
  "auxilio_com_tecnologia",
  "companhia",
  "auxilio_visual",
  "outra_ajuda",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

// RF-CS-04.
export const LIMITE_DO_TITULO = 80;
export const LIMITE_DA_DESCRICAO = 500;

export type DadosDaNovaSolicitacao = {
  titulo?: string | null;
  descricao?: string | null;
  categoria?: string | null;
  // "AAAA-MM-DDTHH:mm", na hora de São Paulo (DEF-CS-01).
  dataEHora?: string | null;
};

export type CampoDaNovaSolicitacao = "titulo" | "descricao" | "categoria" | "dataEHora";

export type ProblemaNoCampo =
  | "vazio" // RF-CS-03, DEF-CS-04
  | "muito_longo" // RF-CS-04, DEF-CS-05
  | "categoria_invalida" // RF-CS-05
  | "data_e_hora_invalida" // RF-CS-03
  | "no_passado"; // RF-CS-06

export type ErroDeCampo = {
  campo: CampoDaNovaSolicitacao;
  problema: ProblemaNoCampo;
  // Só em "muito_longo".
  limite?: number;
};

export type NovaSolicitacaoValida = {
  titulo: string;
  descricao: string;
  categoria: Categoria;
  dataEHora: Date;
};

export type ResultadoDaValidacao =
  | { ok: true; valores: NovaSolicitacaoValida }
  | { ok: false; erros: ErroDeCampo[] };

// DEF-CS-04: campo ausente, null ou só com espaços, tabulações ou quebras de linha fica null.
// DEF-CS-05: senão, o texto sem os espaços do começo e do fim.
function semEspacosNasPontas(valor: string | null | undefined): string | null {
  const texto = (valor ?? "").trim();
  return texto === "" ? null : texto;
}

// DEF-CS-05: cada ponto de código Unicode conta como um caractere.
function tamanho(texto: string): number {
  return [...texto].length;
}

function ehCategoria(valor: string): valor is Categoria {
  return (CATEGORIAS as readonly string[]).includes(valor);
}

export function validarNovaSolicitacao(
  dados: DadosDaNovaSolicitacao,
  agora: Date,
): ResultadoDaValidacao {
  // RNF-US-10: junta os erros de todos os campos, na ordem dos campos, no máximo um por campo.
  const erros: ErroDeCampo[] = [];

  // RF-CS-03, RF-CS-04: título e descrição, vazios ou acima do limite.
  const conferirTexto = (
    campo: "titulo" | "descricao",
    valor: string | null | undefined,
    limite: number,
  ): string | null => {
    const texto = semEspacosNasPontas(valor);
    if (texto === null) {
      erros.push({ campo, problema: "vazio" });
    } else if (tamanho(texto) > limite) {
      erros.push({ campo, problema: "muito_longo", limite });
    }
    return texto;
  };
  const titulo = conferirTexto("titulo", dados.titulo, LIMITE_DO_TITULO);
  const descricao = conferirTexto("descricao", dados.descricao, LIMITE_DA_DESCRICAO);

  // RF-CS-03: categoria vazia. RF-CS-05: fora das sete categorias fixas.
  const categoriaInformada = dados.categoria ?? "";
  let categoria: Categoria | null = null;
  if (semEspacosNasPontas(categoriaInformada) === null) {
    erros.push({ campo: "categoria", problema: "vazio" });
  } else if (ehCategoria(categoriaInformada)) {
    categoria = categoriaInformada;
  } else {
    erros.push({ campo: "categoria", problema: "categoria_invalida" });
  }

  // RF-CS-03: data e hora vazia ou inválida. RF-CS-06: horário já passou (DEF-CS-01).
  const dataEHoraInformada = dados.dataEHora ?? "";
  let dataEHora: Date | null = null;
  if (semEspacosNasPontas(dataEHoraInformada) === null) {
    erros.push({ campo: "dataEHora", problema: "vazio" });
  } else {
    dataEHora = lerDataEHoraLocal(dataEHoraInformada);
    if (dataEHora === null) {
      erros.push({ campo: "dataEHora", problema: "data_e_hora_invalida" });
    } else if (horarioPassou(dataEHora, agora)) {
      erros.push({ campo: "dataEHora", problema: "no_passado" });
    }
  }

  if (erros.length > 0 || titulo === null || descricao === null || categoria === null || dataEHora === null) {
    return { ok: false, erros };
  }
  return { ok: true, valores: { titulo, descricao, categoria, dataEHora } };
}
