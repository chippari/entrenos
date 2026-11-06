import { describe, expect, it } from "vitest";
import { limparDemo } from "@/casos-de-uso/demo/limpar-demo";
import { AGORA, MORADOR_1, MORADOR_2, RepositorioDaDemoFake } from "./repositorio-da-demo-fake";

describe("limparDemo", () => {
  it("deve apagar todos os pedidos e responder 200 quando a demonstração é limpa", async () => {
    // Atende a ação "Limpar demonstração"
    // ARRANGE
    const repositorio = new RepositorioDaDemoFake([MORADOR_1, MORADOR_2]);
    repositorio.guardar({ solicitanteId: MORADOR_1.id });
    repositorio.guardar({ solicitanteId: MORADOR_2.id, apoiadorId: MORADOR_1.id, status: "aceita" });

    // ACT
    const resposta = await limparDemo({ repositorio, agora: AGORA });

    // ASSERT
    expect(resposta).toEqual({ status: 200, corpo: { ok: true } });
    expect(await repositorio.contarPedidos()).toBe(0);
  });
});
