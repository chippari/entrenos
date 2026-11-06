import type { RepositorioDaDemo } from "@/portas/repositorio-da-demo";

// Demonstração temporária. O relógio vem de fora, para o teste poder fixar a hora.
export type DependenciasDaDemo = { repositorio: RepositorioDaDemo; agora: Date };

// O que a rota responde: o status HTTP e o corpo em JSON.
export type RespostaDaDemo = { status: number; corpo: unknown };

// A demonstração guarda e lista no máximo 30 pedidos.
export const LIMITE_DE_PEDIDOS = 30;
