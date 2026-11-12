
import type { SectionVotesResponse } from "../types/eleicoes";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

interface SectionVotesParams {
  municipalityCode: string;
  zone: number;
  section: number;
  ano: number;
  turno: number;
  pagina?: number;
  limite?: number;
  tipo?: "NOMINAL" | "LEGENDA" | "BRANCO" | "NULO";
}

export async function getSectionVotes(
  params: SectionVotesParams,
): Promise<SectionVotesResponse> {
  const query = new URLSearchParams({
    ano: String(params.ano),
    turno: String(params.turno),
    pagina: String(params.pagina ?? 1),
    limite: String(params.limite ?? 100),
  });

  if (params.tipo) {
    query.set("tipo", params.tipo);
  }

  const path =
    `/municipios/${params.municipalityCode}` +
    `/secoes/${params.zone}/${params.section}/votos?${query}`;

  return apiGet<SectionVotesResponse>(path);
}
