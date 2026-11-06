import type {
  Morador,
  NovoPedidoDaDemo,
  PedidoDaDemo,
  RepositorioDaDemo,
  TransicaoDaDemo,
} from "@/portas/repositorio-da-demo";

// Fake: implementação real e simples da porta, em memória (sem banco).
export class RepositorioDaDemoFake implements RepositorioDaDemo {
  private pedidos: PedidoDaDemo[] = [];
  private proximoId = 1;

  constructor(private readonly moradores: Morador[] = []) {}

  async moradorPorId(id: string): Promise<Morador | null> {
    return this.moradores.find((morador) => morador.id === id) ?? null;
  }

  async listarPedidos(limite: number): Promise<PedidoDaDemo[]> {
    // Os mais novos primeiro, como a porta pede.
    return this.pedidos.toReversed().slice(0, limite).map((pedido) => ({ ...pedido }));
  }

  async contarPedidos(): Promise<number> {
    return this.pedidos.length;
  }

  async criarPedido(dados: NovoPedidoDaDemo): Promise<void> {
    this.pedidos.push({ ...dados, id: `pedido-${this.proximoId++}`, status: "aberta", apoiadorId: null });
  }

  async lerPedido(id: string): Promise<PedidoDaDemo | null> {
    const pedido = this.pedidos.find((item) => item.id === id);
    return pedido ? { ...pedido } : null;
  }

  // Gravação condicionada, como o UPDATE ... WHERE do banco (P-01).
  async gravarTransicao(transicao: TransicaoDaDemo): Promise<boolean> {
    const pedido = this.pedidos.find((item) => item.id === transicao.id);
    if (!pedido || pedido.status !== transicao.statusLido) return false;
    if (transicao.apoiadorEsperado !== undefined && pedido.apoiadorId !== transicao.apoiadorEsperado) return false;
    pedido.status = transicao.novoStatus;
    pedido.apoiadorId = transicao.novoApoiadorId;
    return true;
  }

  async apagarTodos(): Promise<void> {
    this.pedidos = [];
  }

  // Apoio aos testes: põe um pedido pronto no estado pedido e devolve uma cópia dele.
  guardar(pedido: Partial<PedidoDaDemo> & Pick<PedidoDaDemo, "solicitanteId">): PedidoDaDemo {
    const completo: PedidoDaDemo = {
      id: `pedido-${this.proximoId++}`,
      titulo: "Regar as plantas da varanda",
      descricao: "São três vasos pequenos.",
      categoria: "regar_plantas",
      dataEHora: "2026-11-07T12:00:00.000Z",
      status: "aberta",
      apoiadorId: null,
      ...pedido,
    };
    this.pedidos.push(completo);
    return { ...completo };
  }
}

// Dados de teste genéricos (ADR-35): rótulos, nunca nomes ou telefones de pessoas.
export const MORADOR_1: Morador = {
  id: "00000000-0000-4000-8000-000000000001",
  nome: "Morador Teste 1",
  unidade: "Apto 101",
  telefone: "(11) 90000-0001",
};
export const MORADOR_2: Morador = {
  id: "00000000-0000-4000-8000-000000000002",
  nome: "Morador Teste 2",
  unidade: "Apto 102",
  telefone: "(11) 90000-0002",
};
export const MORADOR_3: Morador = {
  id: "00000000-0000-4000-8000-000000000003",
  nome: "Morador Teste 3",
  unidade: "Apto 103",
  telefone: "(11) 90000-0003",
};

// Relógio fixo: 6 de novembro de 2026, 9h em São Paulo.
export const AGORA = new Date("2026-11-06T12:00:00.000Z");
