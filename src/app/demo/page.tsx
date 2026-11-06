"use client";

// Demonstração temporária da apresentação: dois celulares, cada um com a conta de um morador.
// As telas seguem docs/mockups/; a navegação entre elas é estado do React, sem rotas novas.
import { useCallback, useEffect, useState } from "react";
import type { Morador } from "@/portas/repositorio-da-demo";
import { BarraDeNavegacao, type Aba, type Acao, type Pedido } from "./pecas";
import {
  Confirmar,
  ConfirmarLimpeza,
  Detalhe,
  Inicio,
  Login,
  MeusPedidos,
  PedirAjuda,
  Perfil,
  Publicado,
  Resultado,
  type AbaDeMeusPedidos,
  type Destino,
  type ResumoDoPedido,
} from "./telas";

// Tela aberta por cima das telas principais. Sem barra de navegação (DT-24).
type TelaPorCima =
  | { tipo: "criar" }
  | { tipo: "publicado"; resumo: ResumoDoPedido }
  | { tipo: "detalhe"; id: string }
  // `pedido` é o pedido como a tela mostrava quando a pessoa pediu a ação.
  | { tipo: "confirmar"; acao: Acao; pedido: Pedido; veioDaLista: boolean }
  | { tipo: "resultado"; acao: Acao; antes: Pedido; motivo: string | null }
  | { tipo: "limpar" };

export default function PaginaDaDemo() {
  return (
    <main>
      <Demo />
    </main>
  );
}

function Demo() {
  // undefined = ainda conferindo a sessão; null = sem sessão.
  const [morador, setMorador] = useState<Morador | null | undefined>(undefined);

  // A sessão fica num cookie que só o servidor lê: quem diz se ela existe é a API.
  useEffect(() => {
    let ativo = true;
    fetch("/api/demo", { cache: "no-store" })
      .then(async (resposta) => (resposta.ok ? ((await resposta.json()) as { morador: Morador }).morador : null))
      .catch(() => null)
      .then((lido) => {
        if (ativo) setMorador(lido);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const voltarAoLogin = useCallback(() => setMorador(null), []);

  async function sair() {
    await fetch("/api/demo/sair", { method: "POST" }).catch(() => null);
    voltarAoLogin();
  }

  if (morador === undefined) return <p className="tela apoio">Carregando…</p>;
  // Sem sessão, a demonstração abre direto no login; a apresentação fica na página inicial (/).
  if (morador === null) return <Login aoEntrar={setMorador} />;
  return <Sessao key={morador.id} morador={morador} aoSair={sair} aoPerderSessao={voltarAoLogin} />;
}

function Sessao({
  morador,
  aoSair,
  aoPerderSessao,
}: {
  morador: Morador;
  aoSair: () => void;
  aoPerderSessao: () => void;
}) {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  // O relógio da tela anda junto com a atualização da lista (rótulos de horário e "Hoje").
  const [agora, setAgora] = useState(() => new Date());
  const [aba, setAba] = useState<Aba>("inicio");
  const [abaDeMeus, setAbaDeMeus] = useState<AbaDeMeusPedidos>("pedi");
  const [porCima, setPorCima] = useState<TelaPorCima | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const resposta = await fetch("/api/demo", { cache: "no-store" });
      if (resposta.ok) setPedidos(((await resposta.json()) as { pedidos: Pedido[] }).pedidos);
      // Sessão encerrada (401) ou cadastro removido (403): volta para o login.
      else if (resposta.status === 401 || resposta.status === 403) aoPerderSessao();
    } catch {
      // Sem rede por um instante: a próxima volta tenta de novo.
    }
    setAgora(new Date());
  }, [aoPerderSessao]);

  useEffect(() => {
    const primeira = setTimeout(carregar, 0);
    const intervalo = setInterval(carregar, 2000);
    return () => {
      clearTimeout(primeira);
      clearInterval(intervalo);
    };
  }, [carregar]);

  // Cada tela nova começa do topo.
  const telaAtual = porCima?.tipo ?? aba;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [telaAtual]);

  const pedidoDe = (id: string) => pedidos?.find((pedido) => pedido.id === id);

  function irPara(destino: Aba) {
    setAba(destino);
    setPorCima(null);
  }

  async function confirmar(acao: Acao, pedido: Pedido) {
    setOcupado(true);
    let motivo: string | null = null;
    try {
      const resposta = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao,
          id: pedido.id,
          // RF-CS-36: na conclusão, vai o apoiador que a tela estava mostrando.
          apoiadorVistoId: acao === "concluir" ? pedido.apoiadorId : undefined,
        }),
      });
      if (!resposta.ok) {
        const corpo = (await resposta.json().catch(() => ({}))) as { motivo?: string };
        motivo = corpo.motivo ?? "erro";
      }
    } catch {
      motivo = "sem_conexao";
    }
    await carregar();
    setOcupado(false);
    setPorCima({ tipo: "resultado", acao, antes: pedido, motivo });
  }

  async function limpar() {
    setOcupado(true);
    await fetch("/api/demo", { method: "DELETE" }).catch(() => null);
    await carregar();
    setOcupado(false);
    irPara("inicio");
  }

  function sairDoResultado(destino: Destino, acao: Acao, id: string) {
    if (destino === "detalhe") {
      setPorCima({ tipo: "detalhe", id });
      return;
    }
    if (destino === "meus") setAbaDeMeus(acao === "desistir" ? "ajudo" : "pedi");
    irPara(destino);
  }

  if (porCima?.tipo === "criar") {
    return (
      <PedirAjuda
        aoVoltar={() => setPorCima(null)}
        aoPublicar={(resumo) => {
          setPorCima({ tipo: "publicado", resumo });
          void carregar();
        }}
      />
    );
  }
  if (porCima?.tipo === "publicado") {
    return <Publicado resumo={porCima.resumo} agora={agora} aoVoltar={() => irPara("inicio")} />;
  }
  if (porCima?.tipo === "detalhe") {
    return (
      <Detalhe
        pedido={pedidoDe(porCima.id)}
        agora={agora}
        aoVoltar={() => setPorCima(null)}
        aoPedir={(acao, pedido) => setPorCima({ tipo: "confirmar", acao, pedido, veioDaLista: false })}
      />
    );
  }
  if (porCima?.tipo === "confirmar") {
    const { acao, pedido, veioDaLista } = porCima;
    return (
      <Confirmar
        acao={acao}
        pedido={pedido}
        agora={agora}
        ocupado={ocupado}
        aoConfirmar={() => confirmar(acao, pedido)}
        aoVoltar={() => setPorCima(veioDaLista ? null : { tipo: "detalhe", id: pedido.id })}
      />
    );
  }
  if (porCima?.tipo === "resultado") {
    const { acao, antes, motivo } = porCima;
    return (
      <Resultado
        acao={acao}
        motivo={motivo}
        antes={antes}
        atual={pedidoDe(antes.id)}
        agora={agora}
        aoSair={(destino) => sairDoResultado(destino, acao, antes.id)}
      />
    );
  }
  if (porCima?.tipo === "limpar") {
    return <ConfirmarLimpeza ocupado={ocupado} aoConfirmar={limpar} aoVoltar={() => setPorCima(null)} />;
  }

  return (
    <>
      {aba === "inicio" && (
        <Inicio
          morador={morador}
          pedidos={pedidos}
          agora={agora}
          aoPedirAjuda={() => setPorCima({ tipo: "criar" })}
          aoAbrir={(id) => setPorCima({ tipo: "detalhe", id })}
        />
      )}
      {aba === "meus" && (
        <MeusPedidos
          pedidos={pedidos}
          agora={agora}
          aba={abaDeMeus}
          aoMudarAba={setAbaDeMeus}
          aoAbrir={(id) => setPorCima({ tipo: "detalhe", id })}
          aoCancelar={(pedido) => setPorCima({ tipo: "confirmar", acao: "cancelar", pedido, veioDaLista: true })}
        />
      )}
      {aba === "perfil" && (
        <Perfil morador={morador} aoSair={aoSair} aoLimpar={() => setPorCima({ tipo: "limpar" })} />
      )}
      <BarraDeNavegacao aba={aba} aoMudar={setAba} />
    </>
  );
}
