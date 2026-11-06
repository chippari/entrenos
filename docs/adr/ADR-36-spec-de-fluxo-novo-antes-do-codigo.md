# ADR-36 — Spec de fluxo novo em PR próprio, antes do código

- Data: 06/11/2026
- Status: Aceito
- Issue: #52
- Técnicas: aula 9 (A9 s.30 a s.32: ADR); aula 3 (A3 s.23: spec e código mudam juntos; A3 s.36: spec antes do código; A3 s.36 a s.41: spec, tasks e código); aula 6 (A6 s.11: spec e código no mesmo PR; A6 s.12: drift)

## Contexto

- A PROC-02 da constituição dizia "Spec e código no mesmo PR", sem exceção.
- Na prática, a spec do webhook entrou num PR próprio, junto com as tasks T-08 a T-13 (#14). O código veio depois (#16, #18, #21 e #23). Já no #23, uma cláusula nova (RF-TW-10) entrou na spec no mesmo PR do código.
- A A3 s.36 pede que a spec seja criada, revisada e versionada antes do código e do teste. A A3 s.23 e a A6 s.11 pedem que spec e código mudem juntos, no mesmo PR.
- A próxima spec, a do ciclo da solicitação (ADR-35), segue o caminho do #14. A revisão do ADR-35 (#49) apontou o atrito com o texto da PROC-02.
- A linha 3 da constituição chama todo o arquivo de princípios, e a linha 7 exige ADR para mudar um princípio. Esta mudança afrouxa uma regra, por isso vem com ADR.

## Alternativas

1. Quando a spec de um fluxo novo entra
   - A) Sempre junto com o primeiro código do fluxo, no mesmo PR.
   - B) Pode entrar num PR só de spec, antes do primeiro código; até esse código entrar na `main`, a spec pode mudar em outros PRs só de spec. Depois, a spec muda junto com o código.
   - C) Sempre em PR separado do código, também nas mudanças depois.
2. O que conta como fluxo novo
   - A) Um arquivo novo em `docs/specs/`.
   - B) Qualquer cláusula nova, mesmo numa spec que já existe.
3. As tasks do fluxo no PR da spec
   - A) Podem entrar junto.
   - B) Ficam num PR próprio.

## Decisão

1B, 2A e 3A. O texto da regra fica na PROC-02 de `docs/constitution.md`.

## Porquê

- 1B: a spec é revisada sozinha, antes de qualquer código (A3 s.36), e o TDD precisa dela pronta para escrever os testes que falham. A opção A mistura a revisão da spec com a do código no mesmo PR. A opção C deixa spec e código divergirem depois que o código existe (drift, A6 s.12), contra a A3 s.23 e a A6 s.11.
- 2A: dá para conferir de forma binária, porque o diff mostra se o arquivo é novo. A opção B faria toda cláusula nova virar PR só de spec, separando spec e código justo quando o código já existe. O #23 mostra o caminho certo: a cláusula nova entrou junto com a rota.
- 3A: as tasks são o plano da spec (spec, tasks e código, A3 s.36 a s.41) e são revisadas junto com ela, como no #14. A opção B criaria um PR a mais sem ganho na revisão.

## Consequências

- A PROC-02 passa a ter duas fases. Até o primeiro código do fluxo entrar na `main`, a spec pode mudar em PRs só de spec. Depois, todo comportamento que a spec ainda não descreve entra na spec no mesmo PR do código, inclusive cláusula nova numa spec que já existe.
- A Verificação da PROC-02 passa a cobrir o PR só de spec: o diff só toca `docs/`, e a descrição do PR registra a revisão só em leitura numa sessão nova (problemas, lacunas e ajustes). Documentos irmãos em `docs/`, como os casos de uso, podem mudar no mesmo PR da spec.
- O #14 já seguiu esse caminho quando a PROC-02 (desde o #10) ainda dizia "Spec e código no mesmo PR". Agora ele tem base no texto.
- A spec do ciclo da solicitação segue esse caminho. Uma spec futura que for arquivo novo (por exemplo, a do bot) também pode seguir.
- Num fluxo entregue em partes, como o ciclo (ADR-35: máquina de estados e depois três fatias), o primeiro código do fluxo é o do primeiro PR com código, a máquina de estados. Depois que ele entra na `main`, mudanças nas cláusulas das partes seguintes entram no mesmo PR do código delas. Por isso, a spec do ciclo precisa estar completa antes da máquina de estados.
- Ao pé da letra, a A6 s.11 diz que código alterado sem atualização de spec bloqueia o PR. A regra nova não exige mexer na spec quando o código só implementa cláusulas que já estão escritas. ⚠️ A pergunta ao professor sobre spec e código no mesmo PR continua aberta (documentação do projeto, fora do repositório).

## Verificação

- Primeira revisão só em leitura numa sessão nova, da primeira troca da PROC-02 (#52): 1 problema (faltava este ADR), 3 lacunas e 1 ajuste. O problema e as lacunas foram aplicados. O ajuste entrou com outro texto, trocado de novo na segunda revisão.
- Segunda revisão só em leitura numa sessão nova, deste ADR e da PROC-02 nova: 0 problemas, 3 lacunas e 3 ajustes, todos aplicados. A L2 trocou a verificação do PR só de spec para "o diff só toca `docs/`", que também barra `package.json`, configurações e `.github/`. A L3 entrou com outro texto: no ciclo, o primeiro código é a máquina de estados, não a primeira fatia.
- O histórico citado foi conferido no git: o #14 trouxe só a spec e as tasks, e o código veio no #16, #18, #21 e #23.
