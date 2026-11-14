import { useEffect, useState } from "react";
import { getCandidatoMapaGeografico } from "../services/candidatosService";
import type { CandidateGeoMunicipality } from "../types/eleicoes";

interface UseComparacaoGeograficaProps {
  sqCandidatoA: string | null;
  sqCandidatoB: string | null;
  ano: number;
  turno: number;
}

export interface MapaConsolidado {
  municipios: CandidateGeoMunicipality[];
  totalVotos: number;
}

const ESTADO_VAZIO: MapaConsolidado = { municipios: [], totalVotos: 0 };

async function buscarTodasPaginas(sqCandidato: string, ano: number, turno: number): Promise<MapaConsolidado> {
  let paginaAtual = 1;
  let totalPaginas = 1;
  const todosMunicipios: CandidateGeoMunicipality[] = [];

  do {
    const resposta = await getCandidatoMapaGeografico(sqCandidato, ano, turno, paginaAtual, 100);
    todosMunicipios.push(...resposta.municipalities);
    totalPaginas = resposta.pagination.totalPages;
    paginaAtual++;
  } while (paginaAtual <= totalPaginas);

  const totalVotos = todosMunicipios.reduce((acc, m) => acc + m.votes, 0);
  return { municipios: todosMunicipios, totalVotos };
}

export function useComparacaoGeografica({ sqCandidatoA, sqCandidatoB, ano, turno }: UseComparacaoGeograficaProps) {
  const [mapaA, setMapaA] = useState<MapaConsolidado>(ESTADO_VAZIO);
  const [mapaB, setMapaB] = useState<MapaConsolidado>(ESTADO_VAZIO);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!sqCandidatoA || !sqCandidatoB) {
      setMapaA(ESTADO_VAZIO);
      setMapaB(ESTADO_VAZIO);
      return;
    }

    let cancelado = false;

    async function buscarDados() {
      try {
        setCarregando(true);
        setErro(null);

        const [resA, resB] = await Promise.all([
          buscarTodasPaginas(sqCandidatoA as string, ano, turno),
          buscarTodasPaginas(sqCandidatoB as string, ano, turno),
        ]);

        if (!cancelado) {
          setMapaA(resA);
          setMapaB(resB);
        }
      } catch (err) {
        if (!cancelado) {
          setErro(err instanceof Error ? err.message : "Erro ao carregar mapas.");
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    buscarDados();
    return () => { cancelado = true; };
  }, [sqCandidatoA, sqCandidatoB, ano, turno]);

  return { mapaA, mapaB, carregando, erro };
}