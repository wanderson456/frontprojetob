
import { useEffect, useState } from "react";

import { getCandidatoMapaGeografico } from "../services/candidatosService";
import type { CandidateGeoMunicipality } from "../types/eleicoes";

interface UseMapaEleitoralProps {
  sqCandidato: string | null;
}

const ANO = 2022;
const TURNO = 1;
const LIMITE_MUNICIPIOS = 100;

export function useMapaEleitoral({
  sqCandidato,
}: UseMapaEleitoralProps) {
  const [municipios, setMunicipios] = useState<CandidateGeoMunicipality[]>([]);
  const [totalMunicipios, setTotalMunicipios] = useState(0);
  const [carregandoMapa, setCarregandoMapa] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (sqCandidato === null) {
      setMunicipios([]);
      setTotalMunicipios(0);
      setCarregandoMapa(false);
      setErro("");
      return;
    }
    const candidatoId = sqCandidato;

    let cancelado = false;

    async function carregarMapa() {
      try {
        setCarregandoMapa(true);
        setErro("");

        const primeiraPagina = await getCandidatoMapaGeografico(
          candidatoId,
          ANO,
          TURNO,
          1,
          LIMITE_MUNICIPIOS,
        );

        const demaisPaginas = await Promise.all(
          Array.from(
            { length: Math.max(0, primeiraPagina.pagination.totalPages - 1) },
            (_, index) =>
              getCandidatoMapaGeografico(
                candidatoId,
                ANO,
                TURNO,
                index + 2,
                LIMITE_MUNICIPIOS,
              ),
          ),
        );

        if (!cancelado) {
          setMunicipios([
            ...primeiraPagina.municipalities,
            ...demaisPaginas.flatMap(
              (pagina) => pagina.municipalities,
            ),
          ]);

          setTotalMunicipios(primeiraPagina.pagination.total);
        }
      } catch (error) {
        if (!cancelado) {
          setMunicipios([]);
          setTotalMunicipios(0);
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o mapa eleitoral.",
          );
        }
      } finally {
        if (!cancelado) {
          setCarregandoMapa(false);
        }
      }
    }

    carregarMapa();

    return () => {
      cancelado = true;
    };
  }, [sqCandidato]);

  return {
    municipios,
    totalMunicipios,
    carregandoMapa,
    erro,
  };
}
