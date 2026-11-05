export interface Mensageiro {
  // Lança erro se o envio falhar.
  enviarTexto(chatId: number, texto: string): Promise<void>;
}
