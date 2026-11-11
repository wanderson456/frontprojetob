import { apiGet } from "./api";

export interface Municipio {
  tseCode: string;
  tseName: string;
  ibgeCode: string;
  ibgeName: string;
}

interface MunicipiosResponse {
  items: Municipio[];
  total: number;
}

export async function getMunicipios(): Promise<Municipio[]> {
  const response = await apiGet<MunicipiosResponse>("/municipios");
  return response.items;
}
