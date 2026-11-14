import MapaComparacaoUnificado from "./MapaComparacaoUnificado";
import type { CandidateGeoMunicipality, SectionItem } from "../../types/eleicoes";

interface MapaComparacaoWrapperProps {
  municipiosA: CandidateGeoMunicipality[];
  municipiosB: CandidateGeoMunicipality[];
  nomeA: string;
  nomeB: string;
  malha: any;
  maiorVotacao: number;
  secoesMapa: SectionItem[];
  municipioSelecionado: CandidateGeoMunicipality | null;
  onSelecionarMunicipio: (mun: CandidateGeoMunicipality) => void;
  onSelecionarSecao: (secao: SectionItem) => void;
}

export default function MapaComparacaoWrapper(props: MapaComparacaoWrapperProps) {
  return <MapaComparacaoUnificado {...props} />;
}