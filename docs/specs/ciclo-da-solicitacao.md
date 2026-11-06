# Spec: ciclo da solicitação

- Origem: código novo. Segue o ciclo SDD + TDD (aula 6, A6 s.2 e s.9). Issue #54. Entra num PR só de spec, antes do primeiro código do fluxo (PROC-02, ADR-36).
- Base: casos de uso UC-01 a UC-05 e decisões DC-01 a DC-12 (`docs/casos-de-uso/ciclo-da-solicitacao.md`); restrições RC-01 a RC-12 (`docs/modelo/dominio-conceitual.md`); constituição P-01 a P-05, P-07, D-01 e D-03; RF-US-01 e RF-US-02 (`docs/specs/usabilidade.md`); ordem de trabalho do ADR-35.
- Escopo: as regras de uma solicitação do tipo normal, iguais no webapp e no bot (P-02): criar, listar, ver, aceitar, desistir, cancelar e concluir; rótulos; quem vê o contato e quando; quem é avisado e de quê.
- Fora do escopo:
  - Textos e botões das mensagens do bot, a pergunta da DC-04, o aviso da DC-05, as respostas da EB-1 e da EB-2 e o contato dentro do chat: ficam para a spec do bot, num arquivo próprio, antes do código do bot.
  - Aviso por e-mail (RF24).
  - O que acontece com as solicitações de quem tem o vínculo suspenso ou removido depois de criar ou aceitar (RF17, bloco 3) ⚠️. Até essa spec, as regras daqui valem sem exceção: a solicitação Aberta de quem foi suspenso continua em Pedidos dos vizinhos e pode ser aceita, e ele não a cancela (RB-CS-02).
  - Olhar Amigo, denúncia, perfil, entrada na rede e a lista de comunidades do seletor (RF22), que vem dos vínculos da pessoa. Avaliação entre moradores não existe (D-01, RC-11).
  - Textos de tela: ficam nos mockups (`docs/mockups/`).
- Depois que o primeiro código deste fluxo (a máquina de estados, T-15) entrar na `main`, toda mudança de comportamento muda esta spec no mesmo PR do código (PROC-02, ADR-36).

## Definições

| ID | Definição |
|---|---|
| DEF-CS-01 | **Horário passou:** a data e a hora de uma solicitação são do fuso de São Paulo (America/Sao_Paulo). O horário passou quando o momento atual é igual ou posterior a essa data e hora. |
| DEF-CS-02 | **Vínculo ativo:** o vínculo da pessoa com a comunidade da solicitação existe e tem o status ativo (não suspenso nem removido, MD-05). **Morador** é qualquer pessoa com vínculo ativo, seja qual for o papel (morador ou admin, DC-06). |
| DEF-CS-03 | **Contato** de uma pessoa: nome, unidade e telefone. A unidade é a do vínculo dela na comunidade da solicitação (MD-03). |
| DEF-CS-04 | **Campo vazio:** campo ausente, ou texto só com espaços, tabulações ou quebras de linha. |
| DEF-CS-05 | **Tamanho de um texto:** o número de caracteres depois de tirar os espaços do começo e do fim, contando cada ponto de código Unicode como um caractere (um emoji composto pode contar mais de um). |
| DEF-CS-06 | **Listagem:** qualquer resposta que traz mais de uma solicitação. Nesta spec: Pedidos dos vizinhos, Eu pedi e Eu ajudo. |
| DEF-CS-07 | **Aviso:** mensagem do sistema a uma pessoa pelo canal de aviso dela (RC-09): pelo Telegram, se ela conectou a conta; senão por e-mail, se ela aceita avisos por e-mail (RF24, fora do escopo); senão nenhum aviso, e ela acompanha pelo webapp. |
| DEF-CS-08 | **Disponibilidade compatível:** a pessoa tem um horário de disponibilidade no mesmo dia da semana da data da solicitação, e a hora da solicitação é igual ou posterior à hora de início e anterior à hora de fim desse horário. A definição supõe hora de fim posterior à de início; como cadastrar um horário que passa da meia-noite fica para a spec do perfil (RF03) ⚠️. |
| DEF-CS-09 | **Execução de uma ação:** o momento em que o sistema recebe o pedido para aceitar, desistir, cancelar ou concluir. No webapp, é o toque em Confirmar. No bot, é o toque no botão que executa a ação. Todas as conferências desta spec são feitas nesse momento. |

## Regras de negócio

| ID | Regra | Origem |
|---|---|---|
| RB-CS-01 | As transições de status seguem só a tabela de transições desta spec. Concluída e Cancelada são finais. | P-02 |
| RB-CS-02 | Toda ação do ciclo, inclusive ver e listar, exige vínculo ativo de quem age na comunidade da solicitação. | P-03, P-05, P-07, RC-01 |
| RB-CS-03 | Uma comunidade que não está ativa não recebe solicitações novas. | P-07, RC-06 |
| RB-CS-04 | Toda transição só é gravada se a solicitação ainda estiver no estado que a ação espera no momento da gravação: o status e, quando a tabela de transições pede, quem é o apoiador. Se duas ações sobre a mesma solicitação chegam ao mesmo tempo, por qualquer canal, só uma muda o status, e a outra é tratada como se tivesse chegado depois. | P-01 (ampliada para todas as transições); UC-02 E1, UC-03 E1, UC-04 E1, UC-05 E4 |
| RB-CS-05 | Toda transição registra uma Transição da solicitação: status de origem, status de destino, autor, origem (webapp ou bot) e data. A criação nasce Aberta e não registra Transição. | Modelo (R15, R16), P-02 |
| RB-CS-06 | O sistema nunca muda o status de uma solicitação sozinho. Só o solicitante e o apoiador mudam o status, pelas ações da tabela de transições. | DC-03, DC-04, DC-05 |
| RB-CS-07 | O solicitante nunca é o apoiador da própria solicitação. | RC-02 |
| RB-CS-08 | O apoiador só existe a partir da aceitação. Na desistência, a solicitação volta a não ter apoiador. No cancelamento e na conclusão, o apoiador continua registrado. | RC-03, DT-19 |
| RB-CS-09 | Com o horário passado (DEF-CS-01), uma solicitação Aberta continua Aberta, sai de Pedidos dos vizinhos e não pode ser aceita. Desistir, cancelar e concluir continuam valendo depois do horário. | DC-03, DC-11 |
| RB-CS-10 | São avisados de uma solicitação nova os moradores da comunidade, exceto o solicitante, que oferecem a categoria dela e têm disponibilidade compatível (DEF-CS-08). | DC-01, DC-06, DC-07, RF07 |
| RB-CS-11 | Na desistência, o sistema avisa de novo pela RB-CS-10, sem avisar quem desistiu. Se o horário já passou, não avisa ninguém de novo. | DC-02 |
| RB-CS-12 | Um aviso que falha não desfaz a transição que o causou. | Decisão S5 da Issue #54 (mesmo padrão do RF-TW-09) |
| RB-CS-13 | Eu pedi e Eu ajudo mostram solicitações de todas as comunidades em que a pessoa tem vínculo ativo. Pedidos dos vizinhos mostra só a comunidade escolhida. | Decisão S7 da Issue #54; RF06, RF12, RF22 |

## Tabela de transições

| Ação | Status antes | Status depois | Quem pode | O que muda no apoiador |
|---|---|---|---|---|
| aceitar | aberta | aceita | um morador que não é o solicitante (RB-CS-07) | passa a ser quem aceitou |
| desistir | aceita | aberta | o apoiador | fica vazio (RB-CS-08) |
| cancelar | aberta | cancelada | o solicitante | continua vazio |
| cancelar | aceita | cancelada | o solicitante | continua registrado (RB-CS-08) |
| concluir | aceita | concluida | o solicitante, desde que o apoiador seja o mesmo que ele via quando abriu a solicitação (RF-CS-36) | continua registrado (RB-CS-08) |

Qualquer combinação de ação e status fora desta tabela é recusada com erro explícito, e nada muda (RF-CS-38). A tabela não olha o horário: a recusa por horário passado fica no caso de uso Aceitar (RF-CS-22).

## Requisitos

### Criar (UC-01)

| ID | Padrão EARS | Cláusula | Origem |
|---|---|---|---|
| RF-CS-01 | Event-driven | WHEN um morador envia, para uma comunidade ativa em que tem vínculo ativo, um título, uma descrição, uma categoria e uma data e hora que passam pelas conferências do RF-CS-03 ao RF-CS-06, THE SYSTEM SHALL criar uma solicitação do tipo normal, com status aberta, sem apoiador, nessa comunidade, com ele como solicitante AND não registrar Transição (RB-CS-05) AND devolver a solicitação criada. | UC-01 passos 1 a 5 e 7; RF04 |
| RF-CS-02 | Event-driven | WHEN uma solicitação é criada, THE SYSTEM SHALL avisar cada morador escolhido pela RB-CS-10, com título, categoria, data e hora, sem o contato de ninguém. Se ninguém se encaixar, ninguém é avisado. | UC-01 passo 6 e A1; DC-01, DC-08; RF07 |
| RF-CS-03 | Unwanted behavior | IF o título, a descrição, a categoria ou a data e hora estiverem vazios (DEF-CS-04), ou a data e hora não forem uma data e hora válidas, THEN THE SYSTEM SHALL não criar a solicitação AND informar cada campo com problema. | UC-01 E1; RF05 |
| RF-CS-04 | Unwanted behavior | IF o título tiver mais de 80 caracteres ou a descrição tiver mais de 500 caracteres (DEF-CS-05), THEN THE SYSTEM SHALL não criar a solicitação AND informar cada campo que passou do limite, com o limite. | Decisão S6 da Issue #54 |
| RF-CS-05 | Unwanted behavior | IF a categoria não for uma das sete categorias fixas, THEN THE SYSTEM SHALL não criar a solicitação AND informar que a categoria não é válida. | UC-01 E2; D-03, DC-07; RF05 |
| RF-CS-06 | Unwanted behavior | IF o horário da data e hora informadas já tiver passado (DEF-CS-01), THEN THE SYSTEM SHALL não criar a solicitação AND informar que a data e hora precisam estar no futuro. | UC-01 E3; DC-03 |
| RF-CS-07 | Unwanted behavior | IF quem envia não tiver vínculo ativo na comunidade, THEN THE SYSTEM SHALL não criar a solicitação, sem conferir os campos, AND informar que ele não pode pedir ajuda nessa comunidade AND não avisar ninguém. | UC-01 E4; P-07, RB-CS-02 |
| RF-CS-08 | Unwanted behavior | IF a comunidade não estiver ativa, THEN THE SYSTEM SHALL não criar a solicitação, sem conferir os campos, AND informar que a comunidade não está liberada para pedidos AND não avisar ninguém. | UC-01 E5; P-07, RB-CS-03 |

O RF-CS-03 ao RF-CS-06 informam todos os campos com problema de uma vez, não só o primeiro (RNF-US-10).

### Listar e ver (UC-02 passos 1 e 2; RF06, RF12)

| ID | Padrão EARS | Cláusula | Origem |
|---|---|---|---|
| RF-CS-09 | Event-driven | WHEN um morador pede os Pedidos dos vizinhos de uma comunidade em que tem vínculo ativo, THE SYSTEM SHALL devolver só as solicitações dessa comunidade com status aberta, com o horário ainda por vir e de outro solicitante, ordenadas pela data e hora, a mais próxima primeiro, sem ordem definida entre as de mesma data e hora, AND devolver de cada uma só o identificador, o título, a categoria e a data e hora. | UC-02 passo 1; RF06; DC-03, DT-08; RB-CS-13 |
| RF-CS-10 | Event-driven | WHEN o morador pede os Pedidos dos vizinhos filtrados por uma categoria, THE SYSTEM SHALL devolver só as solicitações dessa categoria, com as mesmas regras do RF-CS-09. | UC-02 A2; RF06 |
| RF-CS-11 | Unwanted behavior | IF quem pede os Pedidos dos vizinhos não tiver vínculo ativo na comunidade, THEN THE SYSTEM SHALL recusar AND não devolver nenhuma solicitação. | RB-CS-02; P-03 |
| RF-CS-43 | Unwanted behavior | IF a categoria do filtro não for uma das sete categorias fixas, THEN THE SYSTEM SHALL recusar AND informar que a categoria não é válida AND não devolver nenhuma solicitação. | RF06; D-03 |
| RF-CS-12 | Event-driven | WHEN um morador pede o detalhe de uma solicitação de uma comunidade em que tem vínculo ativo, THE SYSTEM SHALL devolver o título, a descrição, a categoria, a data e hora, o status, o nome da comunidade, o papel de quem pede nessa solicitação (solicitante, apoiador ou nenhum dos dois) e o rótulo que vale para ele (RF-CS-41, RF-CS-42) AND devolver o contato do solicitante só pelo RNF-CS-01 AND devolver o contato do apoiador e uma identificação dele, que o pedido de conclusão leva de volta (RF-CS-36), só pelo RNF-CS-02. | UC-02 passo 2; UC-03 a UC-05 passo 1; RF22; DC-08 a DC-10; telas 5 de criar-e-aceitar e 2 e 3 de meus-pedidos |
| RF-CS-13 | Unwanted behavior | IF a solicitação pedida não existir, ou quem pede não tiver vínculo ativo na comunidade dela, THEN THE SYSTEM SHALL recusar com a mesma resposta nos dois casos AND não devolver nenhum dado da solicitação. | RB-CS-02; P-03 |
| RF-CS-14 | Event-driven | WHEN um morador pede a lista Eu pedi, THE SYSTEM SHALL devolver as solicitações em que ele é o solicitante, de todas as comunidades em que tem vínculo ativo (RB-CS-13), AND devolver de cada uma só o identificador, o título, a categoria, a data e hora, o status, o nome da comunidade e o rótulo que vale para ele. | RF12; DT-09, DT-10 |
| RF-CS-15 | Event-driven | WHEN um morador pede a lista Eu ajudo, THE SYSTEM SHALL devolver as solicitações aceitas em que ele é o apoiador e as concluídas e canceladas em que ele é o apoiador registrado (RB-CS-08), de todas as comunidades em que tem vínculo ativo (RB-CS-13), AND devolver de cada uma os mesmos campos do RF-CS-14. | RF12; DT-19 |
| RF-CS-16 | Unwanted behavior | IF o morador tiver solicitações numa comunidade em que o vínculo dele não está ativo, THEN THE SYSTEM SHALL deixá-las fora de Eu pedi e de Eu ajudo. | RB-CS-02; P-03 |

As listas Eu pedi e Eu ajudo não têm ordem definida nesta spec: a separação em Ativos e Encerrados e a ordem dentro de cada grupo são decisões de tela (DT-10). O nome da comunidade vai em cada item porque as listas juntam todas as comunidades (RB-CS-13), embora a tela 1 de `docs/mockups/meus-pedidos.md` e de `docs/mockups/eu-ajudo.md` ainda não o mostre ⚠️.

### Aceitar (UC-02)

| ID | Padrão EARS | Cláusula | Origem |
|---|---|---|---|
| RF-CS-17 | Event-driven | WHEN um morador executa (DEF-CS-09) a aceitação de uma solicitação aberta, com o horário ainda por vir, de outro solicitante, numa comunidade em que tem vínculo ativo, THE SYSTEM SHALL mudar a solicitação para aceita, com ele como apoiador, AND registrar a Transição (RB-CS-05) AND avisar o solicitante. | UC-02 passos 5 a 8; RF08; RF-US-01 |
| RF-CS-18 | Unwanted behavior | IF quem aceita não tiver vínculo ativo na comunidade da solicitação, THEN THE SYSTEM SHALL recusar AND informar que ele não pode aceitar solicitações nessa comunidade AND não mudar nada. | UC-02 E5; P-07 |
| RF-CS-19 | Unwanted behavior | IF quem aceita for o solicitante, THEN THE SYSTEM SHALL recusar AND informar que a solicitação é dele AND não mudar nada. | UC-02 E4; RC-02, RB-CS-07 |
| RF-CS-20 | Unwanted behavior | IF a solicitação já estiver concluída ou cancelada, THEN THE SYSTEM SHALL recusar AND informar que ela foi encerrada AND não mudar nada. | UC-02 E2; P-02 |
| RF-CS-21 | Unwanted behavior | IF a solicitação já estiver aceita por outro morador, inclusive por uma aceitação gravada no mesmo instante por outro canal, THEN THE SYSTEM SHALL recusar AND informar que ela já foi aceita AND não mudar nada. | UC-02 E1; P-01, RB-CS-04; RF09 |
| RF-CS-22 | Unwanted behavior | IF o horário da solicitação já tiver passado (DEF-CS-01), THEN THE SYSTEM SHALL recusar AND informar que ela já passou do horário AND não mudar nada. | UC-02 E3; DC-03, RB-CS-09 |
| RF-CS-44 | Unwanted behavior | IF quem aceita já for o apoiador da solicitação (aceitou antes por outro canal), THEN THE SYSTEM SHALL recusar AND informar que ele já aceitou essa solicitação AND não mudar nada. | UC-02 E1 (caso do próprio apoiador); RB-CS-04 |

### Desistir (UC-03)

| ID | Padrão EARS | Cláusula | Origem |
|---|---|---|---|
| RF-CS-23 | Event-driven | WHEN o apoiador executa (DEF-CS-09) a desistência de uma solicitação aceita, numa comunidade em que tem vínculo ativo, THE SYSTEM SHALL voltar a solicitação para aberta, sem apoiador (RB-CS-08), AND registrar a Transição AND avisar o solicitante AND avisar de novo pela RB-CS-11. | UC-03 passos 2 a 6 e A2; RF10; DC-02 |
| RF-CS-24 | Unwanted behavior | IF quem desiste não tiver vínculo ativo na comunidade da solicitação, THEN THE SYSTEM SHALL recusar AND informar que ele não pode agir nessa comunidade AND não mudar nada. | RB-CS-02; P-05, P-07 |
| RF-CS-25 | Unwanted behavior | IF a solicitação não estiver aceita (foi cancelada, foi concluída, ou está aberta porque a desistência já foi feita por outro canal), THEN THE SYSTEM SHALL recusar AND informar o status atual AND não mudar nada. | UC-03 E1; P-02, RB-CS-04 |
| RF-CS-26 | Unwanted behavior | IF quem desiste não for o apoiador da solicitação, inclusive quando outro morador aceitou depois de uma desistência, THEN THE SYSTEM SHALL recusar AND informar que ele não é o apoiador dela e o status atual AND não mudar nada. | UC-03 E2; RB-CS-04 |

### Cancelar (UC-04)

| ID | Padrão EARS | Cláusula | Origem |
|---|---|---|---|
| RF-CS-27 | Event-driven | WHEN o solicitante executa (DEF-CS-09) o cancelamento de uma solicitação aberta ou aceita, numa comunidade em que tem vínculo ativo, THE SYSTEM SHALL mudar a solicitação para cancelada AND registrar a Transição a partir do status que ela tinha no momento da gravação AND avisar o apoiador, se havia apoiador nesse momento. | UC-04 passos 2 a 4, A2, A3 e A4; RF10 |
| RF-CS-28 | Unwanted behavior | IF quem cancela não tiver vínculo ativo na comunidade da solicitação, THEN THE SYSTEM SHALL recusar AND informar que ele não pode agir nessa comunidade AND não mudar nada. | RB-CS-02; P-05, P-07 |
| RF-CS-29 | Unwanted behavior | IF quem cancela não for o solicitante, THEN THE SYSTEM SHALL recusar AND informar que só quem pediu pode cancelar AND não mudar nada. | UC-04 E2; P-02 |
| RF-CS-30 | Unwanted behavior | IF a solicitação já estiver concluída ou cancelada, THEN THE SYSTEM SHALL recusar AND informar o status final AND não mudar nada. | UC-04 E1; P-02, RB-CS-04 |

### Concluir (UC-05)

| ID | Padrão EARS | Cláusula | Origem |
|---|---|---|---|
| RF-CS-31 | Event-driven | WHEN o solicitante executa (DEF-CS-09) a conclusão de uma solicitação aceita, numa comunidade em que tem vínculo ativo, e o apoiador dela é o mesmo que ele via quando abriu a solicitação (no bot, quando recebeu a pergunta da DC-04), THE SYSTEM SHALL mudar a solicitação para concluida AND registrar a Transição AND avisar o apoiador. A regra não olha o horário: no webapp, a conclusão vale também antes do horário; no bot, ela só existe pela pergunta da DC-04, enviada depois do horário (spec do bot). | UC-05 passos 2 a 4; RF11; DC-11, DC-12 |
| RF-CS-32 | Unwanted behavior | IF quem conclui não tiver vínculo ativo na comunidade da solicitação, THEN THE SYSTEM SHALL recusar AND informar que ele não pode agir nessa comunidade AND não mudar nada. | RB-CS-02; P-05, P-07 |
| RF-CS-33 | Unwanted behavior | IF quem conclui não for o solicitante, THEN THE SYSTEM SHALL recusar AND informar que só quem pediu pode concluir AND não mudar nada. | UC-05 E3; RF11 |
| RF-CS-34 | Unwanted behavior | IF a solicitação já estiver concluída ou cancelada, THEN THE SYSTEM SHALL recusar AND informar o status final AND não mudar nada. | UC-05 E2; P-02, RB-CS-04 |
| RF-CS-35 | Unwanted behavior | IF a solicitação estiver aberta, THEN THE SYSTEM SHALL recusar AND informar que ninguém aceitou a solicitação AND não mudar nada. | UC-05 E1; P-02 |
| RF-CS-36 | Unwanted behavior | IF o pedido de conclusão não trouxer a identificação do apoiador que o solicitante via quando abriu a solicitação (no bot, quando recebeu a pergunta da DC-04), ou ela não for a do apoiador atual, THEN THE SYSTEM SHALL recusar AND informar que o apoiador mudou AND não mudar nada. | UC-05 E4; RB-CS-04 |

### Comum a todas as ações

| ID | Padrão EARS | Cláusula | Origem |
|---|---|---|---|
| RF-CS-37 | Unwanted behavior | IF a solicitação de uma ação não existir, THEN THE SYSTEM SHALL recusar com a mesma resposta da falta de vínculo ativo AND não mudar nada. | RB-CS-02; P-03 |
| RF-CS-38 | Unwanted behavior | IF uma ação for pedida para um status que não tem linha na tabela de transições, THEN THE SYSTEM SHALL recusar com erro explícito AND não mudar nada. O erro é o motivo da cláusula própria do caso (RF-CS-20, RF-CS-21, RF-CS-25, RF-CS-30, RF-CS-34, RF-CS-35 ou RF-CS-44); esta cláusula vale para a combinação que nenhuma delas cobre. | P-02, RB-CS-01 |
| RF-CS-39 | Unwanted behavior | IF a gravação de uma criação ou de uma transição falhar por erro do sistema, THEN THE SYSTEM SHALL não mudar nada AND não enviar nenhum aviso AND informar que não foi possível concluir a ação. A gravação recusada porque outra ação mudou a solicitação antes não é falha: segue a RB-CS-04 e a ordem das conferências. | RB-CS-04, RB-CS-05 |
| RF-CS-40 | Unwanted behavior | IF o envio de um aviso falhar, THEN THE SYSTEM SHALL manter a criação ou a transição AND registrar a falha em log, sem contato, título nem descrição, AND não tentar enviar de novo. | RB-CS-12; RNF-CS-04 |
| RF-CS-45 | Event-driven | WHEN uma aceitação, desistência, cancelamento ou conclusão é gravada, THE SYSTEM SHALL devolver a quem agiu a solicitação no novo status, com os campos que o detalhe (RF-CS-12) devolveria a ele nesse momento. | UC-02 passo 8 e A1; tela 7 de criar-e-aceitar; telas 5 e 7 de meus-pedidos; tela 4 de eu-ajudo |

### Rótulos (DC-03, DC-04)

| ID | Padrão EARS | Cláusula | Origem |
|---|---|---|---|
| RF-CS-41 | State-driven | WHILE uma solicitação estiver aberta e o horário dela tiver passado, THE SYSTEM SHALL devolver ao solicitante o rótulo "Horário passou, ninguém aceitou". | DC-03; UC-04 A3; rótulo aprovado em `docs/mockups/meus-pedidos.md` |
| RF-CS-42 | State-driven | WHILE uma solicitação estiver aceita e o horário dela tiver passado, THE SYSTEM SHALL devolver ao solicitante o rótulo "Falta concluir" AND devolver ao apoiador o rótulo "Aguardando quem pediu concluir". | DC-04; UC-05 A2; DT-13, DT-18 |

Fora dessas duas condições, a solicitação não tem rótulo, e quem não é solicitante nem apoiador nunca recebe rótulo. Rótulo não é status (P-02).

### Privacidade e invariantes

| ID | Padrão EARS | Cláusula | Origem |
|---|---|---|---|
| RNF-CS-01 | Ubiquitous | THE SYSTEM SHALL devolver o contato do solicitante (DEF-CS-03) só ao apoiador dessa solicitação, e só enquanto ela estiver aceita. | P-04, RC-10, DC-08, DC-10; RNF05 |
| RNF-CS-02 | Ubiquitous | THE SYSTEM SHALL devolver o contato do apoiador (DEF-CS-03) e a identificação dele (RF-CS-12) só ao solicitante dessa solicitação, e só enquanto ela estiver aceita. Ao próprio apoiador, o sistema informa só o papel dele (RF-CS-12, RF-CS-15). | RC-12, DC-09, DC-10 |
| RNF-CS-03 | Ubiquitous | THE SYSTEM SHALL nunca incluir o contato de ninguém numa listagem (DEF-CS-06) AND nunca incluir o contato do solicitante em nenhum aviso AND nunca incluir o contato do apoiador em aviso a quem não é o solicitante daquela solicitação. Se o aviso de aceite ao solicitante leva o contato do apoiador é decisão da spec do bot. | P-04, RC-10, RC-12, DC-08, DC-10 |
| RNF-CS-04 | Ubiquitous | THE SYSTEM SHALL nunca registrar em log o contato de ninguém, nem o título ou a descrição de uma solicitação. | RNF04; mesmo padrão do RNF-TW-03 |
| RNF-CS-05 | Ubiquitous | THE SYSTEM SHALL executar cada ação do ciclo pelo mesmo caso de uso no webapp e no bot, com a mesma função de transição, escrita como tabela. | P-02; ARQ-03 |
| RNF-CS-06 | Ubiquitous | THE SYSTEM SHALL nunca mudar o status de uma solicitação sem uma ação do solicitante ou do apoiador (RB-CS-06). | DC-03, DC-04, DC-05 |

## Ordem das conferências

Quando mais de uma recusa se aplica, vale a primeira desta ordem. Assim cada caso tem uma resposta só, e os testes ficam binários.

| Ação | Ordem |
|---|---|
| Pedidos dos vizinhos | 1. vínculo ativo (RF-CS-11) · 2. categoria do filtro (RF-CS-43) |
| Criar | 1. vínculo ativo (RF-CS-07) · 2. comunidade ativa (RF-CS-08) · 3. campos (RF-CS-03 a RF-CS-06, todos juntos) |
| Aceitar | 1. solicitação existe (RF-CS-37) · 2. vínculo ativo (RF-CS-18) · 3. próprio solicitante (RF-CS-19) · 4. encerrada (RF-CS-20) · 5. já é o apoiador (RF-CS-44) · 6. já aceita por outro (RF-CS-21) · 7. horário passado (RF-CS-22) |
| Desistir | 1. solicitação existe (RF-CS-37) · 2. vínculo ativo (RF-CS-24) · 3. não está aceita (RF-CS-25) · 4. não é o apoiador (RF-CS-26) |
| Cancelar | 1. solicitação existe (RF-CS-37) · 2. vínculo ativo (RF-CS-28) · 3. não é o solicitante (RF-CS-29) · 4. encerrada (RF-CS-30) |
| Concluir | 1. solicitação existe (RF-CS-37) · 2. vínculo ativo (RF-CS-32) · 3. não é o solicitante (RF-CS-33) · 4. encerrada (RF-CS-34) · 5. aberta (RF-CS-35) · 6. apoiador mudou (RF-CS-36) |

## Regra de ouro (cada WHEN com seus IF/THEN)

| WHEN | IF/THEN que cobrem a falha |
|---|---|
| RF-CS-01 (criar) | RF-CS-03 (campo vazio ou data inválida), RF-CS-04 (tamanho), RF-CS-05 (categoria), RF-CS-06 (horário passado), RF-CS-07 (vínculo), RF-CS-08 (comunidade), RF-CS-39 (falha ao gravar) |
| RF-CS-02 (avisar ao criar) | RF-CS-40 (falha no aviso) |
| RF-CS-09, RF-CS-10 (Pedidos dos vizinhos) | RF-CS-11 (vínculo), RF-CS-43 (categoria do filtro) |
| RF-CS-12 (detalhe) | RF-CS-13 (não existe ou sem vínculo) |
| RF-CS-14, RF-CS-15 (Eu pedi, Eu ajudo) | RF-CS-16 (comunidade com vínculo não ativo) |
| RF-CS-17 (aceitar) | RF-CS-18 a RF-CS-22, RF-CS-37, RF-CS-38, RF-CS-39, RF-CS-40, RF-CS-44 |
| RF-CS-23 (desistir) | RF-CS-24 a RF-CS-26, RF-CS-37, RF-CS-38, RF-CS-39, RF-CS-40 |
| RF-CS-27 (cancelar) | RF-CS-28 a RF-CS-30, RF-CS-37, RF-CS-38, RF-CS-39, RF-CS-40 |
| RF-CS-31 (concluir) | RF-CS-32 a RF-CS-36, RF-CS-37, RF-CS-38, RF-CS-39, RF-CS-40 |
| RF-CS-45 (resposta da ação) | RF-CS-39 (falha ao gravar) |

## Verificação

| Cláusula | Como verificar | Task |
|---|---|---|
| RB-CS-01, RB-CS-07, RB-CS-08, RF-CS-19 a RF-CS-21, RF-CS-25, RF-CS-26, RF-CS-29, RF-CS-30, RF-CS-33 a RF-CS-36, RF-CS-38, RF-CS-44, RNF-CS-05 (tabela), ordem das conferências (passos da máquina) | Testes unitários da máquina de estados: cada linha da tabela, cada combinação fora dela e cada par de recusas que se aplicam juntas, sem banco nem rede | T-15 |
| DEF-CS-01, DEF-CS-04, DEF-CS-05, RF-CS-03 a RF-CS-06, RF-CS-22 (regra do horário), RF-CS-41, RF-CS-42 | Testes unitários das regras puras, com relógio controlado | T-16 |
| RF-CS-01, RF-CS-02, RF-CS-07 a RF-CS-18, RF-CS-22 a RF-CS-24, RF-CS-27, RF-CS-28, RF-CS-31, RF-CS-32, RF-CS-37, RF-CS-39, RF-CS-40, RF-CS-43, RF-CS-45, RB-CS-02, RB-CS-03, RB-CS-05, RB-CS-09 a RB-CS-13, DEF-CS-02, DEF-CS-07 a DEF-CS-09 | Testes unitários dos casos de uso, com Fake dos repositórios, Mock dos avisos e relógio controlado | ⚠️ Tasks das fatias, ainda a escrever |
| RB-CS-04, RF-CS-21 (gravação no mesmo instante), RF-CS-26 e RF-CS-36 (troca de apoiador) | Teste de integração contra um Postgres real, com duas ações simultâneas: só uma muda o status (como a verificação da P-01) | ⚠️ Tasks das fatias |
| RNF-CS-01 a RNF-CS-03, DEF-CS-03, DEF-CS-06, RF-CS-09, RF-CS-12, RF-CS-14, RF-CS-15, RF-CS-45 (campos devolvidos) | Teste que confere os campos de cada listagem, de cada detalhe, de cada resposta de ação e de cada aviso (no Mock dos avisos), para o solicitante, o apoiador e um terceiro morador; revisão: nenhuma consulta com `select('*')` (P-04) | ⚠️ Tasks das fatias |
| RB-CS-02, RF-CS-11, RF-CS-13, RF-CS-16 no banco | Testes de integração das políticas RLS: vínculo suspenso, removido e de outra comunidade não leem nem gravam (P-03) | ⚠️ Tasks das fatias |
| RNF-CS-04, RNF-CS-06, RB-CS-06 | Revisão de código: nenhum log com dado pessoal; nenhum caminho que muda status sem ação de uma pessoa | Todas |
| Todas, ponta a ponta | Roteiro de teste manual com os dados de teste do ADR-35 | ⚠️ Tasks das fatias |

## Observações

- **RB-CS-04 é mais rígida que a P-01 sem mudá-la.** A P-01 fala só da aceitação. A mesma corrida existe nas outras ações: por exemplo, desistir pelo bot enquanto quem pediu conclui pelo webapp. Por isso, toda transição é condicionada ao estado esperado no momento da gravação.
- **Concluir e o apoiador (RF-CS-31, RF-CS-36):** o pedido de conclusão leva junto quem era o apoiador que o solicitante via. No bot, é o apoiador do momento em que a pergunta da DC-04 foi enviada. Como o bot guarda essa informação fica para a spec do bot.
- **Horário passado só pesa no aceite.** Por isso a conferência fica no caso de uso Aceitar (RF-CS-22), e a tabela de transições trata só de status. Isso resolve o ponto em aberto do caso de uso sobre onde fica a recusa por horário vencido.
- **Desistir de uma solicitação Aberta (RF-CS-25):** a resposta é a mesma para quem já desistiu por outro canal e para quem nunca foi o apoiador, porque a spec não consulta o histórico de transições (DT-19). O texto "Você já tinha desistido deste pedido" (`docs/mockups/eu-ajudo.md`) só aparece no webapp, onde o botão Desistir só existe para o apoiador.
- **Vínculo não ativo (RB-CS-02):** a P-03 exige vínculo ativo em toda leitura e escrita, e a P-05 diz o mesmo para o bot. Por isso, quem tem o vínculo suspenso ou removido não cancela, não desiste e não conclui naquela comunidade. O que acontece com as solicitações que essa pessoa já tinha fica para a spec do RF17 ⚠️.
- **Sem canal de aviso, sem aviso (DEF-CS-07).** No protótipo do ADR-35, ninguém conectou o Telegram e o aviso por e-mail ainda não existe. Então os avisos desta spec não saem, e as pessoas acompanham pelo webapp, como a RC-09 já prevê.
- **Confirmação:** a confirmação antes de aceitar, desistir, cancelar e concluir é passo de tela, não status (RF-US-01, RF-US-02, DC-12). Esta spec trata só do que acontece na execução (DEF-CS-09).
- **Mensagens de recusa:** "informar" quer dizer devolver um motivo que a tela ou o bot transforma em texto. Os textos estão nos mockups e vão para o catálogo de mensagens do bot.
