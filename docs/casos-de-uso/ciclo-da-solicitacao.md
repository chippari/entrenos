# Casos de uso — bloco 1: ciclo da solicitação

- Issue: #30
- Técnicas: aula 5 (A5 s.17–29: estrutura de 8 campos, exceções, notação do diagrama)
- Base: `docs/modelo/dominio-conceitual.md` (nomes das entidades, status e restrições RC) e `docs/constitution.md` (princípios P)
- Fora deste bloco: entrada na rede (bloco 2) e Olhar Amigo, denúncia, perfil e histórico (bloco 3)

## 1. Objetivo e convenções

Este arquivo descreve, do ponto de vista de quem usa, o ciclo de uma solicitação comum: criar, aceitar, desistir, cancelar e concluir. O Olhar Amigo, que é um tipo próprio de solicitação, fica no bloco 3.

Convenções:

- **O sistema** é o EntreNós. **O bot** é a parte do sistema que conversa pelo Telegram.
- **Webapp e bot executam o mesmo caso de uso.** Por isso o bot aparece como fluxo alternativo, e não como caso de uso próprio (P-02).
- **Avisar** quer dizer mandar uma mensagem pelo canal de aviso da pessoa (RC-09): pelo Telegram, se ela o conectou; senão por e-mail, se ela aceita avisos por e-mail (RF24, ainda não especificado); senão ela vê a novidade só no webapp.
- **Exceções** são numeradas (E1, E2...). Cada uma vai virar uma cláusula IF/THEN na spec, e cada fluxo vai virar teste (A5 s.27).
- **Exceções comuns do bot**, que valem para todo fluxo alternativo feito pelo bot:
  - **EB-1 — Chat não conectado.** O chat do Telegram não está ligado a nenhum usuário. O sistema não executa nenhuma ação e só responde com as instruções de como conectar a conta (P-05, RB-TW-01).
  - **EB-2 — Sem vínculo ativo.** O chat está ligado a um usuário, mas ele não tem vínculo ativo na comunidade da solicitação. O sistema não executa nenhuma ação (P-05). ⚠️ O texto da resposta ainda não foi definido.
- Textos de mensagens e de rótulos que aparecem entre aspas são **exemplos** ⚠️. O texto final será decidido nos mockups e no catálogo de mensagens do bot.

## 2. Atores

| Ator | Quem é |
|---|---|
| **Morador** | Pessoa com vínculo ativo numa comunidade. Em cada solicitação, ele faz um dos dois papéis abaixo. |
| **Solicitante** | Morador que cria a solicitação. Só ele cancela e só ele conclui. |
| **Apoiador** | Morador que aceita a solicitação. Só existe a partir da aceitação (RC-03). |
| **Telegram** (ator secundário) | Sistema externo que entrega as mensagens do bot e os toques nos botões. A aula admite atores que são "coisas" (A5 s.12). |

## 3. Diagrama de casos de uso

```mermaid
usecase-beta
direction LR
accTitle: Casos de uso do ciclo da solicitação
accDescr {
  O morador faz dois papéis: solicitante e apoiador.
  O solicitante cria, cancela e conclui. O apoiador aceita e desiste.
  O Telegram entrega as mensagens do bot em todos os casos de uso.
}
actor Morador("Morador")
actor Solicitante("Solicitante")
actor Apoiador("Apoiador")
actor Telegram("Telegram") <<Sistema externo>>
systemBoundary entrenos["EntreNós"]
  UC01("UC-01 Criar solicitação")
  UC02("UC-02 Aceitar solicitação")
  UC03("UC-03 Desistir")
  UC04("UC-04 Cancelar solicitação")
  UC05("UC-05 Concluir solicitação")
end
Solicitante --|> Morador
Apoiador --|> Morador
Solicitante --> UC01
Solicitante --> UC04
Solicitante --> UC05
Apoiador --> UC02
Apoiador --> UC03
UC01 --> Telegram
UC02 --> Telegram
UC03 --> Telegram
UC04 --> Telegram
UC05 --> Telegram
```

Leitura: a seta com triângulo (Solicitante → Morador e Apoiador → Morador) é generalização: solicitante e apoiador são papéis de um morador. As outras linhas ligam cada ator aos casos de uso de que participa.

## 4. Decisões de regra deste bloco

| ID | Decisão | Por quê | Alternativa descartada |
|---|---|---|---|
| DC-01 | Ao criar uma solicitação, são avisados os moradores com vínculo ativo na comunidade, exceto o solicitante, que **oferecem aquela categoria** e cuja **disponibilidade cobre o dia da semana e o horário** da solicitação. | É o que o RF07 pede ("disponibilidade compatível"). Usa os dados que o morador cadastra no perfil (RF03). Avisar todos de tudo cansa e leva as pessoas a silenciar o bot. | (a) Avisar quem oferece a categoria, sem olhar a disponibilidade: ignora o RF07. (b) Avisar todos os moradores: excesso de avisos. |
| DC-02 | Quando o apoiador desiste, o sistema **avisa de novo** pelos critérios da DC-01, **sem avisar quem desistiu**. Se o horário já passou, não avisa. | A desistência costuma acontecer perto do horário; uma volta silenciosa à lista provavelmente não seria vista. Reaproveita a regra da DC-01. | Só voltar para a lista de abertas, sem aviso. |
| DC-03 | Se o horário passou e ninguém aceitou, a solicitação **continua Aberta** (sem status novo), **sai da lista** de abertas, a **aceitação é recusada**, e o solicitante vê um rótulo e pode cancelar. | Não muda a máquina de estados (P-02). É uma regra de exibição e de aceitação. | (a) Status novo "Expirada". (b) Cancelamento automático. As duas mudam a P-02 (o sistema viraria um ator que muda status, e a Transição ganharia uma origem nova) e, enquanto a mudança automática não acontecesse, ainda precisariam desta mesma regra. |
| DC-04 | Se a solicitação foi aceita e o solicitante não confirma a conclusão, ela **continua Aceita**. Depois do horário, o bot **pergunta uma vez** ao solicitante se a ajuda foi feita. O webapp mostra rótulos para os dois lados. **O sistema nunca conclui sozinho.** | Só o solicitante conclui (P-02, ADR-11). Uma pergunta basta para começar. | (a) Perguntar várias vezes: duas regras a mais (quantas vezes e quando parar) sem saber se fazem falta. (b) Concluir automaticamente: muda a P-02. |
| DC-05 | Se o horário passou e ninguém aceitou, o bot **avisa o solicitante uma vez**, com um botão para cancelar. | Deixa claro que a solicitação acabou sem apoiador, sem tirar a decisão da pessoa (P-02). | (a) Cancelamento automático: muda a P-02. (b) Só o rótulo no webapp: quem não abre o webapp não fica sabendo. |

## 5. Rótulos de exibição

Rótulos são textos que o webapp mostra conforme o status e a data. **Não são status.** A máquina de estados continua com Aberta, Aceita, Concluída e Cancelada.

| Rótulo (exemplo ⚠️) | Quem vê | Quando aparece | Decisão |
|---|---|---|---|
| "Horário passou, ninguém aceitou" | Solicitante | Solicitação Aberta, com o horário já passado | DC-03 |
| "Aguardando sua confirmação" | Solicitante | Solicitação Aceita, com o horário já passado | DC-04 |
| "Aguardando confirmação do solicitante" | Apoiador | Solicitação Aceita, com o horário já passado | DC-04 |

## 6. Casos de uso

### UC-01 — Criar solicitação

**Ator:** solicitante. Ator secundário: Telegram.

**Objetivo:** pedir uma pequena ajuda aos vizinhos de uma comunidade.

**Pré-condições:**
1. O morador entrou no webapp.
2. Ele tem vínculo ativo na comunidade escolhida (RC-01).
3. A comunidade está ativa (RC-06).

**Fluxo principal:**
1. O morador escolhe em qual comunidade vai pedir ajuda, se tiver vínculo em mais de uma (RF22).
2. Ele informa título, descrição, categoria, data e horário.
3. Ele confirma.
4. O sistema confere os dados.
5. O sistema cria a solicitação como **Aberta**, sem apoiador.
6. O sistema avisa os moradores escolhidos pela DC-01. O aviso traz título, categoria, data e horário, mas nunca a unidade nem o telefone do solicitante (RC-10). No Telegram, o aviso vem com o botão **Aceitar**.
7. O sistema mostra a solicitação ao morador, com o status Aberta.

**Fluxos alternativos:**
- **A1 — Ninguém compatível.** No passo 6, nenhum morador se encaixa na DC-01. Ninguém é avisado. A solicitação continua visível na lista de abertas da comunidade (RF06).

**Exceções:**
- **E1 — Dado obrigatório faltando.** O sistema não cria a solicitação e diz qual dado falta (RF05).
- **E2 — Categoria fora das seis categorias fixas.** O sistema não cria a solicitação e diz o motivo (RF05).
- **E3 — Data e horário já passaram.** O sistema não cria a solicitação e diz o motivo. ⚠️ Regra proposta neste documento: nenhum RF a cita, mas sem ela a solicitação nasceria vencida (DC-03).
- **E4 — Vínculo não está ativo** (suspenso ou removido) nessa comunidade. O sistema não cria a solicitação (P-07).
- **E5 — Comunidade não está ativa** (pendente ou reprovada). O sistema não cria a solicitação (P-07, RC-06).

**Pós-condições:**
- Sucesso: existe uma solicitação Aberta nessa comunidade, sem apoiador, e os moradores escolhidos pela DC-01 foram avisados.
- Exceção: nada foi criado e ninguém foi avisado.

**Rastreabilidade (acréscimo do projeto):** RF04, RF05, RF06, RF07, RF22 · RC-01, RC-06, RC-09, RC-10 · P-03, P-04, P-07 · DC-01.

---

### UC-02 — Aceitar solicitação

**Ator:** apoiador. Ator secundário: Telegram.

**Objetivo:** assumir uma ajuda pedida por um vizinho.

**Pré-condições:**
1. O morador está identificado: entrou no webapp ou usa um chat do Telegram conectado à conta dele (P-05).
2. Ele tem vínculo ativo na comunidade da solicitação (RC-01).
3. A solicitação está Aberta e o horário dela ainda não passou (DC-03).
4. Ele não é o solicitante (RC-02).

**Fluxo principal (webapp):**
1. O morador abre a lista de solicitações abertas da comunidade. A lista não mostra unidade nem telefone de ninguém (RC-10).
2. Ele escolhe uma solicitação.
3. Ele toca em **Aceitar**.
4. O sistema muda a solicitação para **Aceita**, com esse morador como apoiador, e registra uma Transição da solicitação (de Aberta para Aceita, autor, origem webapp, data).
5. O sistema avisa o solicitante.
6. O sistema passa a mostrar ao apoiador a unidade e o telefone do solicitante (P-04).

**Fluxos alternativos:**
- **A1 — Pelo bot.** O morador recebeu o aviso do UC-01 (passo 6) e toca em **Aceitar** na mensagem. O sistema executa os passos 4 a 6, com origem bot, e responde no chat com a unidade e o telefone do solicitante.
- **A2 — Filtro por categoria.** No passo 1, o morador filtra a lista por categoria (RF06).

**Exceções:**
- **E1 — Outro morador aceitou antes**, mesmo que no mesmo instante e por outro canal (webapp ou bot). Só a primeira aceitação vale. O sistema recusa a segunda, informa que a solicitação já foi aceita, e nada muda (P-01, RF09).
- **E2 — A solicitação já terminou** (Cancelada ou Concluída). O sistema recusa e informa que ela foi encerrada (P-02).
- **E3 — O horário já passou.** Pode acontecer quando alguém toca num botão antigo do bot. O sistema recusa e informa que a solicitação já passou do horário (DC-03).
- **E4 — O morador é o próprio solicitante.** O sistema recusa (RC-02).
- **E5 — Vínculo não está ativo** (suspenso ou removido) na comunidade da solicitação. O sistema recusa (P-07).
- **EB-1 e EB-2** (seção 1), no fluxo A1.

**Pós-condições:**
- Sucesso: a solicitação está Aceita, tem exatamente um apoiador, a Transição foi registrada, o solicitante foi avisado e só o apoiador vê a unidade e o telefone do solicitante.
- Exceção: nada mudou.

**Rastreabilidade (acréscimo do projeto):** RF06, RF08, RF09, RNF01 (contar os toques nos mockups), RNF05 · RC-01, RC-02, RC-10 · P-01, P-02, P-04, P-05, P-07 · DC-03.

---

### UC-03 — Desistir

**Ator:** apoiador. Ator secundário: Telegram.

**Objetivo:** devolver uma ajuda que ele aceitou e não vai poder fazer.

**Pré-condições:**
1. O morador está identificado (P-05).
2. A solicitação está Aceita e ele é o apoiador dela.

**Fluxo principal (webapp):**
1. O apoiador abre a solicitação que aceitou.
2. Ele toca em **Desistir** e confirma.
3. O sistema volta a solicitação para **Aberta**, sem apoiador (RC-03), e registra uma Transição da solicitação (de Aceita para Aberta, autor, origem webapp, data).
4. O sistema avisa o solicitante.
5. O sistema avisa de novo os moradores escolhidos pela DC-01, sem avisar quem desistiu (DC-02).
6. O morador que desistiu deixa de ver a unidade e o telefone do solicitante (P-04).

**Fluxos alternativos:**
- **A1 — Pelo bot.** O apoiador toca em **Desistir** numa mensagem do bot. O sistema executa os passos 3 a 6, com origem bot.
- **A2 — O horário já passou.** No passo 5, ninguém é avisado de novo (DC-02). O solicitante passa a ver o rótulo "Horário passou, ninguém aceitou" (DC-03).

**Exceções:**
- **E1 — A solicitação não está mais Aceita** (o solicitante cancelou ou concluiu antes). O sistema recusa e informa o status atual (P-02).
- **E2 — O morador não é o apoiador dessa solicitação.** O sistema recusa.
- **EB-1 e EB-2** (seção 1), no fluxo A1.

**Pós-condições:**
- Sucesso: a solicitação está Aberta, sem apoiador; a Transição foi registrada; o solicitante foi avisado; o ex-apoiador não vê mais a unidade e o telefone.
- Exceção: nada mudou.

**Rastreabilidade (acréscimo do projeto):** RF10 · RC-03, RC-10 · P-02, P-04, P-05 · DC-02, DC-03.

---

### UC-04 — Cancelar solicitação

**Ator:** solicitante. Ator secundário: Telegram.

**Objetivo:** desistir de uma ajuda que ele pediu.

**Pré-condições:**
1. O morador está identificado (P-05).
2. Ele é o solicitante.
3. A solicitação está Aberta ou Aceita.

**Fluxo principal (webapp):**
1. O solicitante abre a solicitação.
2. Ele toca em **Cancelar** e confirma.
3. O sistema muda a solicitação para **Cancelada**, que é um status final, e registra uma Transição da solicitação (de Aberta ou Aceita para Cancelada, autor, origem webapp, data).
4. Se havia apoiador, o sistema o avisa.

**Fluxos alternativos:**
- **A1 — Pelo bot.** O solicitante toca em **Cancelar** numa mensagem do bot. O sistema executa os passos 3 e 4, com origem bot.
- **A2 — Aviso de horário vencido (DC-05).** O horário passou e ninguém aceitou. O bot avisa o solicitante uma vez, por exemplo: "Ninguém aceitou sua solicitação. Quer cancelar?" ⚠️, com o botão **Cancelar**. Se ele tocar, o sistema executa os passos 3 e 4, com origem bot. Se não tocar, a solicitação continua Aberta (DC-03), e o bot não avisa de novo.
- **A3 — Rótulo no webapp (DC-03).** Na lista das próprias solicitações, o solicitante vê o rótulo "Horário passou, ninguém aceitou", com o botão **Cancelar** ao lado. Ao tocar, segue o fluxo principal a partir do passo 2.
- **A4 — Alguém aceitou enquanto o solicitante decidia.** A solicitação estava Aberta quando ele a abriu e ficou Aceita antes do toque em Cancelar. O cancelamento continua valendo, porque Aceita também pode ser cancelada, e o novo apoiador é avisado no passo 4.

**Exceções:**
- **E1 — A solicitação já terminou** (Concluída ou Cancelada). O sistema recusa e informa o status final (P-02).
- **E2 — O morador não é o solicitante.** O sistema recusa (P-02: só o solicitante cancela).
- **EB-1 e EB-2** (seção 1), nos fluxos A1 e A2.

**Pós-condições:**
- Sucesso: a solicitação está Cancelada e não muda mais; a Transição foi registrada; o apoiador, se havia, foi avisado.
- Exceção: nada mudou.

**Rastreabilidade (acréscimo do projeto):** RF10 · P-02, P-05 · DC-03, DC-05.

---

### UC-05 — Concluir solicitação

**Ator:** solicitante. Ator secundário: Telegram.

**Objetivo:** confirmar que a ajuda foi feita.

**Pré-condições:**
1. O morador está identificado (P-05).
2. Ele é o solicitante.
3. A solicitação está Aceita.

**Fluxo principal (webapp):**
1. Depois da ajuda, o solicitante abre a solicitação.
2. Ele toca em **Confirmar que foi feita**.
3. O sistema muda a solicitação para **Concluída**, que é um status final, e registra uma Transição da solicitação (de Aceita para Concluída, autor, origem webapp, data).
4. O sistema avisa o apoiador.

Não existe avaliação entre moradores depois da conclusão (D-01, RC-11).

**Fluxos alternativos:**
- **A1 — Pergunta do bot (DC-04).** O horário passou e a solicitação continua Aceita. O bot pergunta ao solicitante uma vez, por exemplo: "A ajuda foi feita?" ⚠️, com o botão **Sim, foi feita**. Se ele tocar, o sistema executa os passos 3 e 4, com origem bot.
- **A2 — Rótulos no webapp (DC-04).** Depois do horário, o solicitante vê "Aguardando sua confirmação" e o apoiador vê "Aguardando confirmação do solicitante". O solicitante pode concluir pelo fluxo principal.
- **A3 — O solicitante não responde.** A solicitação continua Aceita. O bot não pergunta de novo, e o sistema não conclui sozinho (DC-04).

**Exceções:**
- **E1 — A solicitação está Aberta** (ninguém aceitou). Não há ajuda a confirmar. O sistema recusa (P-02).
- **E2 — A solicitação já terminou** (Concluída ou Cancelada), por exemplo quando o botão do bot é tocado depois de concluir pelo webapp. O sistema recusa e informa o status final (P-02).
- **E3 — O morador não é o solicitante** (por exemplo, o apoiador tenta concluir). O sistema recusa (RF11).
- **EB-1 e EB-2** (seção 1), no fluxo A1.

**Pós-condições:**
- Sucesso: a solicitação está Concluída e não muda mais; a Transição foi registrada; o apoiador foi avisado.
- Exceção: nada mudou.

**Rastreabilidade (acréscimo do projeto):** RF11, RF12 · RC-11 · P-02, P-05 · D-01 · DC-04.

## 7. Pontos em aberto ⚠️

Não mudam os fluxos acima, mas precisam de resposta na spec ou nos mockups.

- Textos exatos dos avisos, das perguntas do bot e dos rótulos (mockups e catálogo de mensagens).
- Como o sistema sabe que já perguntou (DC-04) ou já avisou (DC-05), para fazer isso uma vez só. Talvez exija um dado novo na Solicitação, o que mexeria no modelo.
- Quem não usa Telegram: a pergunta da DC-04 e o aviso da DC-05 também vão por e-mail, com um link para o webapp? (RF24)
- UC-01, E3: confirmar a regra "não criar solicitação com data e horário já passados".
- Vínculo suspenso ou removido depois de criar ou aceitar: a pessoa ainda pode cancelar, desistir ou concluir? (efeitos da suspensão, RF17)
- Depois que a solicitação é Cancelada ou Concluída, o ex-apoiador continua vendo a unidade e o telefone do solicitante? (P-04)
- O que o solicitante vê do apoiador quando é avisado da aceitação (nome? contato?).
- O solicitante pode concluir antes do horário marcado, se a ajuda já aconteceu?
- Texto da resposta do bot na EB-2.
- O diagrama usa o tipo `usecase-beta` do Mermaid, que é recente e ainda está em beta. ⚠️ Conferir se o GitHub o desenha.
