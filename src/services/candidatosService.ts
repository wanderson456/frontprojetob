
import { apiGet } from "./api";
import type {
  CandidateGeoResponse,
  CandidateListResponse,
} from "../types/eleicoes";

export interface CandidateListParams {
  ano: number;
  turno: number;
  cargo?: number;
  busca?: string;
  numero?: string;
  pagina?: number;
  limite?: number;
}

export async function getCandidatos(
  params: CandidateListParams,
): Promise<CandidateListResponse> {
  const query = new URLSearchParams({
    ano: String(params.ano),
    turno: String(params.turno),
    pagina: String(params.pagina ?? 1),
    limite: String(params.limite ?? 20),
  });

  if (params.cargo !== undefined) {
    query.set("cargo", String(params.cargo));
  }

  if (params.busca) {
    query.set("busca", params.busca);
  }

  if (params.numero) {
    query.set("numero", params.numero);
  }

  return apiGet<CandidateListResponse>(
    `/candidatos?${query.toString()}`,
  );
}

export async function getCandidatoMapaGeografico(
  sqCandidato: string,
  ano: number,
  turno: number,
  page: number = 1,
  limit: number = 20,
): Promise<CandidateGeoResponse> {
  const params = new URLSearchParams({
    ano: String(ano),
    turno: String(turno),
    pagina: String(page),
    limite: String(limit),
  });

  return apiGet<CandidateGeoResponse>(
    `/candidatos/${encodeURIComponent(sqCandidato)}/mapa-geografico?${params.toString()}`,
  );
}
