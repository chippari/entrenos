import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { criarRegistroDeAtualizacoesSupabase } from "@/infra/supabase/registro-de-atualizacoes-supabase";

const UPDATE_ID = 1001;

// Erros como o supabase-js devolve na execução: objetos JSON simples (não instâncias de PostgrestError).
const ERRO_DUPLICATA = {
  code: "23505",
  message: "duplicate key value violates unique constraint",
  details: "Key (update_id)=(1001) already exists.",
  hint: null,
};
const ERRO_PERMISSAO = {
  code: "42501",
  message: "permission denied for table telegram_updates",
  details: null,
  hint: null,
};

describe("criarRegistroDeAtualizacoesSupabase", () => {
  let insert: Mock;
  let from: Mock;
  let cliente: SupabaseClient;

  beforeEach(() => {
    // Stub do cliente Supabase: resposta configurável por teste, sem banco nem rede.
    insert = vi.fn().mockResolvedValue({ data: null, error: null });
    from = vi.fn().mockReturnValue({ insert });
    cliente = { from } as unknown as SupabaseClient;
  });

  it("deve devolver true quando o insert do update_id não tem erro", async () => {
    // Atende RF-TW-01
    // ARRANGE
    const registro = criarRegistroDeAtualizacoesSupabase(cliente);

    // ACT
    const novo = await registro.registrarSeNovo(UPDATE_ID);

    // ASSERT
    expect(from).toHaveBeenCalledWith("telegram_updates");
    expect(insert).toHaveBeenCalledWith({ update_id: UPDATE_ID });
    expect(novo).toBe(true);
  });

  it("deve devolver false quando o insert falha por chave duplicada", async () => {
    // Atende RF-TW-05
    // ARRANGE
    insert.mockResolvedValue({ data: null, error: ERRO_DUPLICATA });
    const registro = criarRegistroDeAtualizacoesSupabase(cliente);

    // ACT
    const novo = await registro.registrarSeNovo(UPDATE_ID);

    // ASSERT
    expect(insert).toHaveBeenCalledWith({ update_id: UPDATE_ID });
    expect(novo).toBe(false);
  });

  it("deve rejeitar com o código, sem a mensagem do banco, quando o insert falha por outro erro", async () => {
    // Atende RF-TW-06 e RNF-TW-02
    // ARRANGE
    insert.mockResolvedValue({ data: null, error: ERRO_PERMISSAO });
    const registro = criarRegistroDeAtualizacoesSupabase(cliente);

    // ACT
    const resultado = registro.registrarSeNovo(UPDATE_ID);

    // ASSERT
    await expect(resultado).rejects.toThrow("42501");
    await expect(resultado).rejects.not.toThrow("permission denied");
    expect(insert).toHaveBeenCalledWith({ update_id: UPDATE_ID });
  });

  it("deve rejeitar quando a promessa do insert rejeita", async () => {
    // Atende RF-TW-06
    // ARRANGE
    insert.mockRejectedValue(new Error("fetch failed"));
    const registro = criarRegistroDeAtualizacoesSupabase(cliente);

    // ACT
    const resultado = registro.registrarSeNovo(UPDATE_ID);

    // ASSERT
    await expect(resultado).rejects.toThrow();
    expect(insert).toHaveBeenCalledWith({ update_id: UPDATE_ID });
  });
});
