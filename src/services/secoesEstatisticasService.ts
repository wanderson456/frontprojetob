import { apiGet } from "./api";

export interface EstatisticasAPI {
  validos?: number;
  brancos?: number;
  nulos?: number;
  total?: number;
  votosValidos?: number;
  votosBrancos?: number;
  votosNulos?: number;
}

export async function getEstatisticasSecao(zona: number, secao: number) {
  const dados = await apiGet<EstatisticasAPI>(`/secoes/${zona}/${secao}/estatisticas`);

  const validos = dados.validos ?? dados.votosValidos ?? 0;
  const brancos = dados.brancos ?? dados.votosBrancos ?? 0;
  const nulos = dados.nulos ?? dados.votosNulos ?? 0;
  const total = dados.total ?? (validos + brancos + nulos);

  return { validos, brancos, nulos, total };
}