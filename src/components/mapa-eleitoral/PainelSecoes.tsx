
import type {
  CandidateGeoMunicipality,
  SectionItem,
  SectionVoteItem,
} from "../../types/eleicoes";

import ResultadoSecao from "./ResultadoSecao";

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
  const secoesOrdenadas = secoes
    .slice()
    .sort((a, b) => a.zone - b.zone || a.section - b.section);

  return (
    <aside className="mapa-painel-secoes">
      <header className="mapa-painel-header">
        <div>
          <span>ACOMPANHAMENTO ELEITORAL</span>
          <h2>Seções de {municipio.municipality}</h2>
          <p>{secoes.length} seções encontradas</p>
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
      )}

      <ResultadoSecao
        votosSecao={votosSecao}
        carregando={carregandoVotos}
        erro={erroVotos}
      />

      <div className="mapa-painel-lista">
        <div className="mapa-painel-colunas">
          <span>Zona</span>
          <span>Seção</span>
          <span>Votos</span>
        </div>

        {secoesOrdenadas.map((secao) => {
          const selecionada =
            secaoSelecionada?.zone === secao.zone &&
            secaoSelecionada?.section === secao.section;

          return (
            <button
              type="button"
              key={`${secao.zone}-${secao.section}`}
              className={`mapa-painel-linha ${selecionada ? "selecionada" : ""}`}
              onClick={() => onSelecionarSecao(secao)}
            >
              <span>{secao.zone}</span>
              <span>{secao.section}</span>
              <strong>{secao.votes.toLocaleString("pt-BR")}</strong>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
