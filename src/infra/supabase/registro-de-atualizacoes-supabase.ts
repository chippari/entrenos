import type { SupabaseClient } from "@supabase/supabase-js";
import type { RegistroDeAtualizacoes } from "@/portas/registro-de-atualizacoes";

// Código do Postgres para violação de chave única (update_id já registrado).
const CHAVE_DUPLICADA = "23505";

export function criarRegistroDeAtualizacoesSupabase(cliente: SupabaseClient): RegistroDeAtualizacoes {
  return {
    async registrarSeNovo(updateId) {
      // RF-TW-01. Se a promessa rejeitar (falha de rede), o erro sobe (RF-TW-06).
      const { error } = await cliente.from("telegram_updates").insert({ update_id: updateId });
      if (!error) return true;
      // RF-TW-05: a chave primária garante "uma vez só" (P-06).
      if (error.code === CHAVE_DUPLICADA) return false;
      // RF-TW-06 e RNF-TW-02: só o código; a mensagem do banco não sai daqui.
      throw new Error(`Falha ao registrar a atualização do Telegram (código ${error.code})`);
    },
  };
}
