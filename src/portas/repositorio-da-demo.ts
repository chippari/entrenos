import type { StatusDaSolicitacao } from "@/dominio/solicitacao/maquina-de-estados";

// Demonstração temporária: moradores e pedidos da página /demo.
export type Morador = { id: string; nome: string; unidade: string; telefone: string };

export type PedidoDaDemo = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  // ISO 8601.
  dataEHora: string;
  status: StatusDaSolicitacao;
  solicitanteId: string;
  apoiadorId: string | null;
};

export type NovoPedidoDaDemo = Pick<PedidoDaDemo, "titulo" | "descricao" | "categoria" | "dataEHora" | "solicitanteId">;

export type TransicaoDaDemo = {
  id: string;
  // P-01: só grava se o pedido ainda estiver neste status...
  statusLido: StatusDaSolicitacao;
  // ...e, quando informado, com este apoiador.
  apoiadorEsperado?: string;
  novoStatus: StatusDaSolicitacao;
  novoApoiadorId: string | null;
};

// Todos os métodos lançam erro se o acesso aos dados falhar.
export interface RepositorioDaDemo {
  moradorPorId(id: string): Promise<Morador | null>;
  // Os mais novos primeiro.
  listarPedidos(limite: number): Promise<PedidoDaDemo[]>;
  contarPedidos(): Promise<number>;
  criarPedido(dados: NovoPedidoDaDemo): Promise<void>;
  lerPedido(id: string): Promise<PedidoDaDemo | null>;
  // true = alguma linha mudou; false = o pedido não estava mais como foi lido.
  gravarTransicao(transicao: TransicaoDaDemo): Promise<boolean>;
  apagarTodos(): Promise<void>;
}
