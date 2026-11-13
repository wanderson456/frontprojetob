
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
}: PainelSecoesProps) {
  const [abaAtiva, setAbaAtiva] = useState<AbaPainel>("votacao");
  const [buscaSecao, setBuscaSecao] = useState("");
  const [mostrarTodas, setMostrarTodas] = useState(false);

  const secoesOrdenadas = secoes
    .slice()
    .sort((a, b) => a.zone - b.zone || a.section - b.section);

  const termo = buscaSecao.trim().toLowerCase();

  const secoesFiltradas = secoesOrdenadas.filter(
    (secao) =>
      String(secao.zone).includes(termo) ||
      String(secao.section).includes(termo),
  );

  const secoesExibidas = mostrarTodas
    ? secoesFiltradas
    : secoesFiltradas.slice(0, 5);

  const secoesNoMesmoLocal = secaoSelecionada
    ? secoes.filter((secao) => {
      if (secaoSelecionada.pollingPlaceNumber !== null) {
        return (
          secao.pollingPlaceNumber ===
          secaoSelecionada.pollingPlaceNumber
        );
      }

      if (
        secaoSelecionada.latitude !== null &&
        secaoSelecionada.longitude !== null
      ) {
        return (
          secao.latitude === secaoSelecionada.latitude &&
          secao.longitude === secaoSelecionada.longitude
        );
      }

      return false;
    }).length
    : 0;

  useEffect(() => {
    if (secaoSelecionada) {
      setAbaAtiva("votacao");
    }
  }, [secaoSelecionada?.zone, secaoSelecionada?.section]);

  function selecionarSecao(secao: SectionItem) {
    setAbaAtiva("votacao");
    onSelecionarSecao(secao);
  }

  return (
    <aside className="mapa-painel-secoes">
      <header className="mapa-painel-header">
        <div className="mapa-painel-header-info">
          <span>ACOMPANHAMENTO ELEITORAL</span>
          <h2>Seções de {municipio.municipality}</h2>
          <p>{secoes.length} seções encontradas</p>
        </div>

        <div className="mapa-painel-header-resumo">
          <span>Votos do candidato no município</span>
          <strong>{municipio.votes.toLocaleString("pt-BR")}</strong>
        </div>

        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar painel"
        >
          ×
        </button>
      </header>

      {secaoSelecionada && (
        <div className="mapa-painel-detalhe">
          <div className="mapa-painel-detalhe-principal">
            <span>SEÇÃO SELECIONADA</span>

            <h3>
              Zona {secaoSelecionada.zone} · Seção {secaoSelecionada.section}
            </h3>

            <strong>
              {secaoSelecionada.votes.toLocaleString("pt-BR")} votos
            </strong>

            <p>
              {secaoSelecionada.pollingPlaceName ?? "Local não identificado"}
            </p>

            <small>
              {secaoSelecionada.pollingPlaceAddress ?? "Endereço não informado"}
            </small>
          </div>

          <div className="mapa-painel-detalhe-resumo">
            <div>
              <span>Local de votação</span>
              <strong>
                {secaoSelecionada.pollingPlaceNumber ?? "—"}
              </strong>
            </div>

            <div>
              <span>Seções neste local</span>
              <strong>
                {secoesNoMesmoLocal > 0
                  ? secoesNoMesmoLocal
                  : "Não identificado"}
              </strong>
            </div>
          </div>
        </div>
      )}

      <nav className="mapa-painel-abas" role="tablist" aria-label="Conteúdo do painel">
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === "votacao"}
          className={abaAtiva === "votacao" ? "ativo" : ""}
          onClick={() => setAbaAtiva("votacao")}
        >
          Votação
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === "secoes"}
          className={abaAtiva === "secoes" ? "ativo" : ""}
          onClick={() => setAbaAtiva("secoes")}
        >
          Seções ({secoes.length})
        </button>
      </nav>

      <div className="mapa-painel-conteudo">
        {abaAtiva === "votacao" ? (
          <div role="tabpanel">
            <ResultadoSecao
              votosSecao={votosSecao}
              carregando={carregandoVotos}
              erro={erroVotos}
            />
          </div>
        ) : (
          <div className="mapa-painel-secoes-conteudo" role="tabpanel">
            <div className="mapa-painel-busca">
              <input
                type="search"
                value={buscaSecao}
                placeholder="Pesquisar zona ou seção..."
                aria-label="Pesquisar zona ou seção"
                onChange={(event) => {
                  setBuscaSecao(event.target.value);
                  setMostrarTodas(false);
                }}
              />
            </div>

            <div className="mapa-painel-colunas">
              <span>Zona</span>
              <span>Seção</span>
              <span>Votos</span>
            </div>

            {secoesExibidas.map((secao) => {
              const selecionada =
                secaoSelecionada?.zone === secao.zone &&
                secaoSelecionada?.section === secao.section;

              return (
                <button
                  type="button"
                  key={`${secao.zone}-${secao.section}`}
                  className={`mapa-painel-linha ${selecionada ? "selecionada" : ""}`}
                  onClick={() => selecionarSecao(secao)}
                >
                  <span>{secao.zone}</span>
                  <span>{secao.section}</span>
                  <strong>{secao.votes.toLocaleString("pt-BR")}</strong>
                </button>
              );
            })}

            {secoesFiltradas.length === 0 && (
              <p className="mapa-painel-vazio">
                Nenhuma seção encontrada.
              </p>
            )}

            {secoesFiltradas.length > 5 && (
              <button
                type="button"
                className="mapa-painel-ver-todas"
                onClick={() => setMostrarTodas((atual) => !atual)}
                aria-expanded={mostrarTodas}
              >
                {mostrarTodas
                  ? "Mostrar apenas 5 seções"
                  : `Ver todas as ${secoesFiltradas.length} seções`}
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
