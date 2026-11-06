# ADR-34 — Categoria "Outra ajuda" e nome do solicitante só depois do aceite

- Data: 05/11/2026
- Status: Aceito
- Issue: #37 (decisões surgidas nos mockups da Issue #36)
- Técnicas: aula 3 (A3 s.27 e s.28: regras de negócio explícitas e numeradas); aula 9 (A9 s.30 a s.32: ADR)

## Contexto

- A D-03 da constituição fixa seis categorias de ajuda. Nos mockups da Issue #36, apareceu um caso sem resposta: um pedido que não cabe em nenhuma das seis não tem lugar. A pessoa desiste ou escolhe uma categoria errada, e aí o aviso vai para as pessoas erradas (DC-01).
- A Verificação da seção 2 da constituição diz que reverter qualquer decisão de produto exige ADR novo. A D-03 vem dos documentos da matéria.
- A P-04 protege a unidade e o telefone de quem pediu: só o apoiador que aceitou os vê. Ela não fala do nome. Nos mockups, a lista e o detalhe não mostram o nome, e a tela de aceite mostra nome, unidade e telefone juntos.
- Um pedido como "vou viajar no fim de semana", com o nome junto, diz a toda a comunidade quem vai deixar o apartamento vazio.

## Alternativas

1. Pedido que não cabe nas categorias (DC-07)
   - A) Manter as seis categorias. O pedido diferente não é aceito.
   - B) Uma sétima categoria, "Outra ajuda", tratada como as outras: o morador marca no perfil se oferece esse tipo de ajuda.
   - C) Categoria em texto livre, escrita por quem pede.
   - D) O admin da comunidade cria categorias novas.
2. Quando o nome de quem pediu aparece (DC-08)
   - A) Sempre, inclusive na lista e no aviso.
   - B) Só o primeiro nome na lista; o nome completo depois do aceite.
   - C) Só depois do aceite, junto com a unidade e o telefone.

## Decisão

1B e 2C. O texto completo das duas decisões fica na tabela de decisões de `docs/casos-de-uso/ciclo-da-solicitacao.md` (DC-07 e DC-08).

## Porquê

- 1B: resolve o pedido sem lugar e mantém a regra de aviso da DC-01 igual, porque "Outra ajuda" é só mais um valor da lista. A opção A deixa a pessoa sem saída. A opção C impede casar o pedido com o perfil de quem oferece ajuda, então ninguém seria avisado. A opção D exige telas e regras novas de administração que nenhum RF prevê.
- 2C: o nome fica com a mesma proteção da unidade e do telefone, numa regra só. A opção A expõe quem pede, como no exemplo da viagem. A opção B ainda identifica a pessoa numa comunidade pequena.

## Consequências

- A D-03 da constituição passa a ter sete categorias. Isso diverge dos documentos da matéria, que citam seis. A divergência é registrada na seção "Divergências com os documentos da matéria" da próxima versão da documentação do projeto (`projeto_entrenos`, fora do repositório).
- O modelo de domínio ganha o valor "outra ajuda" na lista de categorias (tabela e diagrama). A RC-10 passa a incluir o nome.
- O UC-01 muda a exceção E2 ("fora das sete categorias"), o aviso do passo 6, que também não traz o nome, e o passo 2, que passa a mostrar o que não pode ser pedido. O UC-02 deixa claro que o nome não aparece na lista nem no detalhe antes do aceite, e passa a mostrá-lo junto da unidade e do telefone depois do aceite.
- Também foram alinhados ao nome: o UC-03 (quem desiste deixa de ver nome, unidade e telefone), a pergunta em aberto sobre o ex-apoiador, as Observações da spec de usabilidade e as linhas de Rastreabilidade do UC-01, do UC-02 e do UC-03.
- A spec de usabilidade passa a citar o nome no RF-US-01 e no RF-US-02.
- O perfil (RF03) passa a oferecer "Outra ajuda" porque a lista de categorias do modelo ganhou esse valor. A tela de perfil ainda não existe; ela entra nos mockups do bloco 3.
- A Verificação da P-04 testa só a ausência de unidade e telefone na listagem. A ausência do nome entra pela RC-10: a spec da listagem vai ter uma cláusula e um teste para ela.
- Risco: "Outra ajuda" facilita pedidos fora do escopo (serviço pago, dinheiro, emergência). Mitigação: o formulário mostra o que não pode ser pedido e os números de emergência (UC-01, passo 2), e qualquer morador pode denunciar a solicitação (RF16).
- A P-04 não muda: ela diz o mínimo (unidade e telefone), e a DC-08 é mais rígida sem contradizê-la. Levar o nome para dentro da P-04 exigiria outro ADR.
- O que o solicitante vê do apoiador continua em aberto.

## Verificação

- Revisão só em leitura numa sessão nova do Claude Code, na Issue #37: nenhum problema, 3 lacunas e 5 ajustes, todos aplicados.
