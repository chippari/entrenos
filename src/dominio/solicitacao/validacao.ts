// Validação dos campos ao criar uma solicitação (RF-CS-03 a RF-CS-06; docs/specs/ciclo-da-solicitacao.md).
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

export function validarNovaSolicitacao(
  dados: DadosDaNovaSolicitacao,
  agora: Date,
): ResultadoDaValidacao {
  void dados;
  void agora;
  throw new Error("Não implementado (T-16).");
}
