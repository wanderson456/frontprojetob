import { useEffect, useState } from "react";
import type {
  CandidateGeoMunicipality,
  SectionItem,
  SectionVoteItem,
} from "../../types/eleicoes";
import ResultadoSecao from "./ResultadoSecao";

type AbaPainel = "votacao" | "secoes";

interface PainelSecoesProps {
  municipio: CandidateGeoMunicipality;
  secoes: SectionItem[];
  secaoSelecionada: SectionItem | null;
  votosSecao: SectionVoteItem[];
  carregandoVotos: boolean;
  erroVotos: string;
  onFechar: () => void;
  onSelecionarSecao: (secao: SectionItem) => void;
  nomeCandidatoA: string;
  nomeCandidatoB: string;
  cargoSelecionadoId: number | null;
  numeroCandidatoA: string;
  numeroCandidatoB: string;
}

export default function PainelSecoes({
  municipio,
  secoes,
  secaoSelecionada,
  votosSecao,
  carregandoVotos,
  erroVotos,
  onFechar,
  onSelecionarSecao,
  nomeCandidatoA,
  nomeCandidatoB,
  cargoSelecionadoId,
  numeroCandidatoA,
  numeroCandidatoB,
}: PainelSecoesProps) {
  const [abaAtiva, setAbaAtiva] = useState<AbaPainel>("votacao");
  const [abaCargo, setAbaCargo] = useState<number | null>(null);
  const [buscaSecao, setBuscaSecao] = useState("");
  const [mostrarTodas, setMostrarTodas] = useState(false);

  const secoesOrdenadas = secoes.slice().sort((a, b) => a.zone - b.zone || a.section - b.section);
  const termo = buscaSecao.trim().toLowerCase();
  const secoesFiltradas = secoesOrdenadas.filter(
    (secao) => String(secao.zone).includes(termo) || String(secao.section).includes(termo)
  );
  const secoesExibidas = mostrarTodas ? secoesFiltradas : secoesFiltradas.slice(0, 5);

  // Quando a seção muda, reseta para a aba "votacao"
  useEffect(() => {
    if (secaoSelecionada) {
      setAbaAtiva("votacao");
    }
  }, [secaoSelecionada?.zone, secaoSelecionada?.section]);

  // Quando a seção muda, define o cargo inicial como o cargo comparado
  useEffect(() => {
    if (secaoSelecionada && cargoSelecionadoId) {
      setAbaCargo(cargoSelecionadoId);
    } else {
      setAbaCargo(null);
    }
  }, [secaoSelecionada?.zone, secaoSelecionada?.section, cargoSelecionadoId]);

  function selecionarSecao(secao: SectionItem) {
    setAbaAtiva("votacao");
    onSelecionarSecao(secao);
  }

  return (
    <aside className="mapa-painel-secoes" style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff", borderRadius: "8px", border: "1px solid #eaeaea", overflow: "hidden" }}>
      <header className="mapa-painel-header" style={{ flexShrink: 0, padding: "1rem", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="mapa-painel-header-info">
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>ACOMPANHAMENTO ELEITORAL</span>
          <h2 style={{ margin: "0.25rem 0 0 0", fontSize: "1.1rem" }}>Seções de {municipio.municipality}</h2>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>{secoes.length} seções encontradas</p>
        </div>
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar painel"
          style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#999", lineHeight: 1, padding: 0, marginLeft: "0.5rem" }}
        >
          ×
        </button>
      </header>

      <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
        {secaoSelecionada && (
          <div className="mapa-painel-detalhe" style={{ marginBottom: "1rem", background: "#fce7f3", padding: "1rem", borderRadius: "8px" }}>
            <div className="mapa-painel-detalhe-principal">
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#C92071", textTransform: "uppercase" }}>SEÇÃO SELECIONADA</span>
              <h3 style={{ margin: "0.25rem 0", fontSize: "1rem" }}>Zona {secaoSelecionada.zone} · Seção {secaoSelecionada.section}</h3>
              <strong style={{ fontSize: "1.2rem", color: "#C92071" }}>{secaoSelecionada.votes.toLocaleString("pt-BR")} votos</strong>
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem", color: "#333" }}>{secaoSelecionada.pollingPlaceName ?? "Local não identificado"}</p>
              <small style={{ fontSize: "0.75rem", color: "#666" }}>{secaoSelecionada.pollingPlaceAddress ?? "Endereço não informado"}</small>
            </div>
          </div>
        )}

        <nav className="mapa-painel-abas" style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <button type="button" onClick={() => setAbaAtiva("votacao")} style={{ flex: 1, padding: "0.5rem", borderRadius: "6px", border: "1px solid #ddd", background: abaAtiva === "votacao" ? "#C92071" : "#fff", color: abaAtiva === "votacao" ? "#fff" : "#666", cursor: "pointer", fontWeight: 500 }}>Votação</button>
          <button type="button" onClick={() => setAbaAtiva("secoes")} style={{ flex: 1, padding: "0.5rem", borderRadius: "6px", border: "1px solid #ddd", background: abaAtiva === "secoes" ? "#C92071" : "#fff", color: abaAtiva === "secoes" ? "#fff" : "#666", cursor: "pointer", fontWeight: 500 }}>Seções ({secoes.length})</button>
        </nav>

        {abaAtiva === "votacao" ? (
          <ResultadoSecao
            votosSecao={votosSecao}
            carregando={carregandoVotos}
            erro={erroVotos}
            nomeCandidatoA={nomeCandidatoA}
            nomeCandidatoB={nomeCandidatoB}
            cargoSelecionadoId={cargoSelecionadoId}
            numeroCandidatoA={numeroCandidatoA}
            numeroCandidatoB={numeroCandidatoB}
            abaSelecionada={abaCargo}
            onAbaChange={setAbaCargo}
          />
        ) : (
          <div>
            <input type="search" value={buscaSecao} placeholder="Pesquisar zona ou seção..." style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ddd", marginBottom: "1rem" }} onChange={(event) => { setBuscaSecao(event.target.value); setMostrarTodas(false); }} />
            {secoesExibidas.map((secao) => {
              const selecionada = secaoSelecionada?.zone === secao.zone && secaoSelecionada?.section === secao.section;
              return (
                <button type="button" key={`${secao.zone}-${secao.section}`} onClick={(e) => { e.preventDefault(); selecionarSecao(secao); }} style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "0.75rem", marginBottom: "0.5rem", borderRadius: "6px", border: "1px solid", borderColor: selecionada ? "#C92071" : "#eee", background: selecionada ? "#fce7f3" : "#fff", cursor: "pointer" }}>
                  <span style={{ fontSize: "0.85rem" }}>Zona {secao.zone} · Seção {secao.section}</span>
                </button>
              );
            })}
            {secoesFiltradas.length > 5 && (
              <button type="button" onClick={() => setMostrarTodas((atual) => !atual)} style={{ width: "100%", padding: "0.5rem", background: "transparent", border: "1px dashed #ddd", borderRadius: "6px", cursor: "pointer", color: "#666", fontSize: "0.8rem" }}>
                {mostrarTodas ? "Mostrar menos" : `Ver todas as ${secoesFiltradas.length} seções`}
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}