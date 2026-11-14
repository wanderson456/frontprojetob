import MapaLeaflet from "../mapa-eleitoral/MapaLeaflet";
import PainelSecoes from "../mapa-eleitoral/PainelSecoes";
import type { CandidateGeoMunicipality, SectionItem, SectionVoteItem, CandidateListItem } from "../../types/eleicoes";

interface MapaDetalhamentoProps {
  candidatoA: CandidateListItem | null;
  malha: any;
  municipios: CandidateGeoMunicipality[];
  municipiosComCoordenadas: CandidateGeoMunicipality[];
  secoesMapa: SectionItem[];
  municipioSelecionado: CandidateGeoMunicipality | null;
  onSelecionarMunicipio: (mun: CandidateGeoMunicipality) => void;
  onSelecionarSecao: (secao: SectionItem) => void;
  painelAberto: boolean;
  secaoSelecionada: SectionItem | null;
  votosSecao: SectionVoteItem[];
  carregandoVotos: boolean;
  erroVotos: string;
  onFecharPainel: () => void;
  nomeCandidatoA: string;
  nomeCandidatoB: string;
  cargoSelecionadoId: number | null;
  numeroCandidatoA: string;
  numeroCandidatoB: string;
  anoSelecionado: number;
  turnoSelecionado: number;
  codigoTseMunicipio: string;
}

export default function MapaDetalhamento({
  candidatoA,
  malha,
  municipios,
  codigoTseMunicipio,
  municipiosComCoordenadas,
  secoesMapa,
  municipioSelecionado,
  onSelecionarMunicipio,
  onSelecionarSecao,
  painelAberto,
  secaoSelecionada,
  votosSecao,
  carregandoVotos,
  erroVotos,
  onFecharPainel,
  nomeCandidatoA,
  nomeCandidatoB,
  cargoSelecionadoId,
  numeroCandidatoA,
  numeroCandidatoB,
  anoSelecionado,
  turnoSelecionado,
}: MapaDetalhamentoProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: painelAberto && municipioSelecionado ? "1fr 400px" : "1fr", gap: "1rem", transition: "all 0.3s" }}>
      <div className="mapa-container">
        <MapaLeaflet
          candidatoId={candidatoA?.sqCandidato ?? ""}
          malha={malha}
          municipios={municipios}
          municipiosComCoordenadas={municipiosComCoordenadas}
          secoesMapa={secoesMapa}
          municipioSelecionado={municipioSelecionado}
          modo="municipios"
          onSelecionarMunicipio={onSelecionarMunicipio}
          onSelecionarSecao={onSelecionarSecao}
          anoSelecionado={anoSelecionado}
          turnoSelecionado={turnoSelecionado}
          codigoTseMunicipio={codigoTseMunicipio}
        />
      </div>

      {painelAberto && municipioSelecionado && (
        <PainelSecoes
          municipio={municipioSelecionado}
          secoes={secoesMapa}
          secaoSelecionada={secaoSelecionada}
          votosSecao={votosSecao}
          carregandoVotos={carregandoVotos}
          erroVotos={erroVotos}
          onFechar={onFecharPainel}
          onSelecionarSecao={onSelecionarSecao}
          nomeCandidatoA={nomeCandidatoA}
          nomeCandidatoB={nomeCandidatoB}
          cargoSelecionadoId={cargoSelecionadoId}
          numeroCandidatoA={numeroCandidatoA}
          numeroCandidatoB={numeroCandidatoB}
        />
      )}
    </div>
  );
}