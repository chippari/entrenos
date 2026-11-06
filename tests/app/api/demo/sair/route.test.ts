import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/demo/sair/route";
import { apagarSessao } from "@/app/api/demo/sessao";

// Mock da sessão: registra a chamada, sem cookie de verdade.
vi.mock("@/app/api/demo/sessao", () => ({ apagarSessao: vi.fn() }));

describe("POST /api/demo/sair", () => {
  it("deve apagar o cookie da sessão e responder 200 quando o morador sai", async () => {
    // Atende a Issue #64 (a): sair apaga o cookie
    // ARRANGE (nada a preparar)

    // ACT
    const resposta = await POST();

    // ASSERT
    expect(apagarSessao).toHaveBeenCalledTimes(1);
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({ ok: true });
  });
});
