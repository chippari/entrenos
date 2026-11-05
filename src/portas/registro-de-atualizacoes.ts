export interface RegistroDeAtualizacoes {
  // true = novo; false = já registrado; lança erro se o registro falhar.
  registrarSeNovo(updateId: number): Promise<boolean>;
}
