import type { Mensageiro } from "@/portas/mensageiro";

export function criarMensageiroTelegram(opcoes: {
  token: string;
  fetch: typeof globalThis.fetch;
}): Mensageiro {
  return {
    async enviarTexto(chatId, texto) {
      let resposta: Response;
      try {
        // RF-TW-07: sendMessage da Bot API oficial (D-02). O token vai na URL.
        resposta = await opcoes.fetch(`https://api.telegram.org/bot${opcoes.token}/sendMessage`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: texto }),
        });
      } catch {
        // RF-TW-09 e RNF-TW-02: o erro original pode conter a URL com o token; não é repassado.
        throw new Error("Falha de rede ao enviar mensagem do Telegram");
      }
      if (!resposta.ok) {
        // RF-TW-09 e RNF-TW-02: só o status; o corpo da resposta não é lido.
        throw new Error(`Falha ao enviar mensagem do Telegram (status ${resposta.status})`);
      }
    },
  };
}
