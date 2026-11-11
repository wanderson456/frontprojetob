import { apiGet } from "./api";
import type {
  SectionResponse,
  SectionSearchParams,
} from "../types/eleicoes";

export async function getMunicipioSecoes(
  params: SectionSearchParams,
): Promise<SectionResponse> {
  const query = new URLSearchParams({
    ano: String(params.ano),
    turno: String(params.turno),
    sqCandidato: params.sqCandidato,
    pagina: String(params.pagina ?? 1),
    limite: String(params.limite ?? 20),
  });

  return apiGet<SectionResponse>(
    `/municipios/${encodeURIComponent(params.municipalityCode)}/secoes?${query.toString()}`,
  );
}