
import { useEffect, useState } from "react";

import { getCandidatos } from "../services/candidatosService";
import type { CandidateListItem } from "../types/eleicoes";

interface UseCandidatosProps {
  cargo: number;
  busca: string;
  pagina: number;
  onAntesDeCarregar: () => void;
}

const ANO = 2022;
const TURNO = 1;
const LIMITE_CANDIDATOS = 100;

export function useCandidatos({
  cargo,
  busca,
  pagina,
  onAntesDeCarregar,
}: UseCandidatosProps) {
  const [candidatos, setCandidatos] = useState<CandidateListItem[]>([]);
  const [candidato, setCandidato] = useState<CandidateListItem | null>(null);
  const [totalPaginasCandidatos, setTotalPaginasCandidatos] = useState(1);
  const [carregandoCandidatos, setCarregandoCandidatos] = useState(false);
  const [erroCandidatos, setErroCandidatos] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function carregarCandidatos() {
      try {
        onAntesDeCarregar();

        setCarregandoCandidatos(true);
        setErroCandidatos("");
        setCandidato(null);

        const resposta = await getCandidatos({
          ano: ANO,
          turno: TURNO,
          cargo,
          busca: busca.trim() || undefined,
          pagina,
          limite: LIMITE_CANDIDATOS,
        });

        if (!cancelado) {
          setCandidatos(resposta.items);
          setCandidato(resposta.items[0] ?? null);
          setTotalPaginasCandidatos(resposta.totalPages);
        }
      } catch (error) {
        if (!cancelado) {
          setCandidatos([]);
          setCandidato(null);
          setErroCandidatos(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os candidatos.",
          );
        }
      } finally {
        if (!cancelado) {
          setCarregandoCandidatos(false);
        }
      }
    }

    carregarCandidatos();

    return () => {
      cancelado = true;
    };
  }, [cargo, busca, pagina, onAntesDeCarregar]);

  return {
    candidatos,
    candidato,
    setCandidato,
    totalPaginasCandidatos,
    carregandoCandidatos,
    erroCandidatos,
  };
}
