"use client";

// Demonstração temporária da apresentação: dois celulares, um morador fictício em cada.
// As telas seguem docs/mockups/; a navegação entre elas é estado do React, sem rotas novas.
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { BarraDeNavegacao, MORADORES, type Aba, type Acao, type Pedido } from "./pecas";
import {
  Confirmar,
  ConfirmarLimpeza,
  Detalhe,
  Escolha,
  Inicio,
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
      <Suspense fallback={<p className="tela apoio">Carregando…</p>}>
        <Demo />
      </Suspense>
    </main>
  );
}

function Demo() {
  const eu = useSearchParams().get("eu");
  if (!eu || !Object.hasOwn(MORADORES, eu)) return <Escolha />;
  return <Morador key={eu} eu={eu} />;
}

function Morador({ eu }: { eu: string }) {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  // O relógio da tela anda junto com a atualização da lista (rótulos de horário e "Hoje").
  const [agora, setAgora] = useState(() => new Date());
  const [aba, setAba] = useState<Aba>("inicio");
  const [abaDeMeus, setAbaDeMeus] = useState<AbaDeMeusPedidos>("pedi");
  const [porCima, setPorCima] = useState<TelaPorCima | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const resposta = await fetch(`/api/demo?eu=${eu}`, { cache: "no-store" });
      if (resposta.ok) setPedidos(((await resposta.json()) as { pedidos: Pedido[] }).pedidos);
    } catch {
      // Sem rede por um instante: a próxima volta tenta de novo.
    }
    setAgora(new Date());
  }, [eu]);

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
          eu,
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
    await fetch(`/api/demo?eu=${eu}`, { method: "DELETE" }).catch(() => null);
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
        eu={eu}
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
          eu={eu}
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
      {aba === "perfil" && <Perfil eu={eu} aoLimpar={() => setPorCima({ tipo: "limpar" })} />}
      <BarraDeNavegacao aba={aba} aoMudar={setAba} />
    </>
  );
}
