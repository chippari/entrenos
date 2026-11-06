import type { DependenciasDaDemo, RespostaDaDemo } from "@/casos-de-uso/demo/dependencias";

export async function limparDemo({ repositorio }: DependenciasDaDemo): Promise<RespostaDaDemo> {
  await repositorio.apagarTodos();
  return { status: 200, corpo: { ok: true } };
}
