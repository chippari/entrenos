# ADR-27 — Arquitetura em camadas com portas e regra de imports no ESLint

- Data: 05/11/2026
- Status: Aceito
- Issue: #11
- Técnicas: aula 9 (A9 s.8–10, s.18, s.21–22, s.25, s.30–32)

## Contexto

- Ainda não existe código de regra de negócio. O primeiro será o webhook do Telegram.
- A aula 9 pede regras numa camada própria (SRP), dependendo de abstrações e não de banco, APIs ou interface (DIP), com as camadas visíveis nas pastas e os imports obedecendo à arquitetura.
- A documentação inicial dizia que as rotas de API "concentram regras de negócio". Assim, webapp e bot acabariam com cópias da mesma regra, contra o P-02 da constituição.
- Testes unitários não usam banco, rede nem arquivos (PROC-04). Para testar regras com Fake e Mock, as regras precisam receber as dependências por interface.
- A aula apresenta os estilos monolítico, MVC, multicamadas e Clean sem exigir nenhum.

## Alternativas

1. Estilo de arquitetura
   - A) Camadas com portas (Clean leve).
   - B) Multicamadas sem portas: os casos de uso chamam o Supabase direto.
   - C) Regras de negócio dentro das rotas de API.
2. Como cobrar a direção dos imports
   - A) Regra nativa `no-restricted-imports` do ESLint, configurada por pasta.
   - B) Plugin dedicado (ex.: `eslint-plugin-boundaries`).
   - C) Só revisão humana.
3. O que fazer com `src/lib/supabase/admin.ts`
   - A) Fica onde está e é tratado como infraestrutura até ser movido.
   - B) Mover já para `src/infra/supabase/`.

## Decisão

1A, 2A e 3A. As camadas e as regras de import estão na seção 4 da constituição (`docs/constitution.md`). As pastas novas nascem junto com o primeiro código que precisa delas.

## Porquê

- 1A é a única opção que permite testar as regras com Fake e Mock, sem banco, e que garante uma única função de transição para webapp e bot. A opção B deixa o DIP de fora e obriga a simular o cliente do Supabase em todos os testes. A opção C viola SRP e DIP.
- 2A não acrescenta dependência e usa o lint que o CI já roda: PR com import proibido fica vermelho. A opção B é uma dependência nova para um projeto pequeno. A opção C não é verificável.
- 3A segue a aula 10: refatorar só com os testes da área garantidos (A10 s.26). O `admin.ts` tem 0% de cobertura até a T-05.

## Consequências

- Mais arquivos por funcionalidade (porta, implementação e caso de uso).
- `src/app/` vira o ponto de montagem: cria as implementações de `infra/` e as entrega aos casos de uso.
- A regra compara o texto do import como foi escrito (biblioteca `ignore`, no estilo gitignore, sem diferenciar maiúsculas e minúsculas). Ela pega o alias (`@/infra/x`) e o caminho relativo (`../infra/x`), mas a importação da pasta em si (`@/infra`) precisa de um padrão próprio. A regra não descobre para qual arquivo o import aponta.
- `import type` também é bloqueado (opção `allowTypeImports` desligada): regra de negócio não conhece nem os tipos da infraestrutura.
- ⚠️ A lista de bibliotecas de infraestrutura proibidas é uma lista negativa: uma biblioteca nova desse tipo precisa ser acrescentada à configuração.
- Refactor pendente: mover `src/lib/supabase/admin.ts` para `src/infra/supabase/` depois da T-05.
- Este é o primeiro ADR guardado no repositório. Os ADR-01 a ADR-26 ainda estão fora dele (migração pendente).

## Verificação

- Teste de sanidade no PR: arquivos temporários com imports proibidos em cada camada fazem o lint falhar; imports permitidos não falham; os arquivos são apagados depois.
- O CI roda o lint em todo PR.
