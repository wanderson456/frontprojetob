import { apiGet } from "./api";
import type {
  CandidateGeoResponse,
  CandidateListResponse,
  SectionItem,
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

// ==========================================
// SEÇÕES (RESTAURADA)
// ==========================================

export interface SecoesParams {
  municipalityCode: string;
  sqCandidato: string;
  ano: number;
  turno: number;
  pagina: number;
  limite: number;
}

export interface SecoesResponse {
  items: SectionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getMunicipioSecoes(
  params: SecoesParams,
): Promise<SecoesResponse> {
  const query = new URLSearchParams({
    sqCandidato: params.sqCandidato,
    ano: String(params.ano),
    turno: String(params.turno),
    pagina: String(params.pagina),
    limite: String(params.limite),
  });

  return apiGet<SecoesResponse>(
    `/municipios/${params.municipalityCode}/secoes?${query.toString()}`,
  );
}

// ==========================================
// VOTOS POR SEÇÃO (NOVO)
// ==========================================

export interface VotoSecao {
  quantity: number;
  voteType: "NOMINAL" | "LEGENDA" | "BRANCO" | "NULO";
  [key: string]: any;
}

export interface VotosSecaoResponse {
  items: VotoSecao[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getVotosSecao(
  codigo: string,
  zona: number,
  secao: number,
  ano: number,
  turno: number,
  pagina: number = 1,
  limite: number = 100,
): Promise<VotosSecaoResponse> {
  const params = new URLSearchParams({
    ano: String(ano),
    turno: String(turno),
    pagina: String(pagina),
    limite: String(limite),
  });

  return apiGet<VotosSecaoResponse>(
    `/municipios/${codigo}/secoes/${zona}/${secao}/votos?${params.toString()}`
  );
}