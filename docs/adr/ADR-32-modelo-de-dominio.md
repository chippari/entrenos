# ADR-32 — Modelo de domínio conceitual e decisões de domínio MD-01 a MD-05

- Data: 05/11/2026
- Status: Aceito
- Issue: #26 (PR #27); registrado em `docs/adr/` pela #28
- Técnicas: aula 4 (A4 s.8–14); aula 5 (A5 s.9, s.10, s.30–37)

## Contexto

- A aula 4 pede o modelo de domínio conceitual antes das tabelas: entidades, atributos e relacionamentos com multiplicidade, sem tecnologia.
- O esboço de tabelas da documentação do projeto tinha cinco perguntas em aberto que mudam a estrutura: onde fica a disponibilidade, quantos admins cada comunidade tem, quem informa a unidade, qual o papel do Telegram e de quem é a suspensão.
- A constituição falava em "usuário suspenso" (P-07) e "usuário ativo" (P-05), mas quem suspende é o admin de uma comunidade só (RF17).
- Os slides citam Miro, Lucidchart e draw.io para desenhar diagramas (A5 s.10).

## Alternativas

1. Disponibilidade e tipos de ajuda oferecidos (MD-01)
   - A) No Usuário.
   - B) No Vínculo.
2. Admins por comunidade (MD-02)
   - A) Um só.
   - B) Mais de um.
3. Unidade do morador (MD-03)
   - A) Informada pelo admin no convite.
   - B) Informada pelo morador no cadastro.
4. Papel do Telegram (MD-04)
   - A) Obrigatório para todos.
   - B) Opcional, sem outro canal de aviso.
   - C) Opcional, com aviso por e-mail para quem não usa, e obrigatório nos dois lados do Olhar Amigo.
5. Suspensão (MD-05)
   - A) Status no Usuário, valendo em todas as comunidades.
   - B) Status no Vínculo, valendo numa comunidade.
6. Formato do diagrama
   - A) draw.io (citado nos slides).
   - B) Mermaid dentro do `.md`.

## Decisão

1A, 2B, 3A, 4C, 5B e 6B. O modelo está em `docs/modelo/dominio-conceitual.md`. A tabela de decisões do modelo traz o texto completo de cada MD.

## Porquê

- 1A: a pessoa tem um só horário de vida. Ficam menos telas e menos regras.
- 2B: o papel fica no Vínculo, e o modelo já permite vários admins. Proibir exigiria uma regra a mais.
- 3A: o admin sabe quem mora onde. O morador não consegue se declarar em outra unidade.
- 4C: o público inclui pessoas que usam e-mail e não usam Telegram; sem outro canal, elas nunca seriam avisadas. O Olhar Amigo exige Telegram porque a videochamada acontece nele (ADR-20) e e-mail é lento para uma ajuda imediata. A escolha do provedor de e-mail fica no ADR-33 (ainda fora do repositório).
- 5B: quem suspende é o admin da comunidade, que só tem poder sobre ela. A opção A exigiria um papel com poder sobre todas as comunidades, que nenhum RF prevê.
- 6B: o diagrama fica versionado junto com o texto, é revisado pelo diff e o GitHub o desenha sozinho.

## Consequências

- O modelo tem 11 entidades, os relacionamentos R1 a R20 e as restrições RC-01 a RC-11. As restrições viram regras de negócio (RB) nas specs.
- O Usuário não tem status. Ativo, suspenso e removido são status do Vínculo. A constituição foi alinhada na Issue #28 (P-03, P-05 e P-07).
- Entra um requisito novo: aviso por e-mail para quem não usa Telegram (RF24), com prioridade baixa.
- O esboço de tabelas da documentação do projeto precisa ser conferido contra o modelo antes das migrations.
- ⚠️ A aceitação do Mermaid pelo professor ainda não foi confirmada. O diagrama ficou denso e pode ser dividido por assunto.

## Verificação

- Revisão do Claude Code em duas rodadas, só em leitura, contra a constituição. A primeira achou um erro de multiplicidade no R8 (impedia entrar numa segunda comunidade), uma data repetida entre Solicitação e Transição, citações a ajustar e nomes de tabela no texto. A segunda confirmou as 8 correções.
- Diagrama conferido no GitHub depois do push.
