
import { apiGet } from "./api";
import type { ElectionResult } from "../types/eleicoes";

export async function getResultados(
  codigoMunicipio: string,
  ano: number,
  turno: number,
): Promise<ElectionResult> {
  const params = new URLSearchParams({
    ano: String(ano),
    turno: String(turno),
  });

  return apiGet<ElectionResult>(
    `/municipios/${codigoMunicipio}/resultados?${params.toString()}`,
  );
}
