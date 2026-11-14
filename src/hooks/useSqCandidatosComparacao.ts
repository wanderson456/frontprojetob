import { useEffect, useState } from "react";
import { getCandidatos } from "../services/candidatosService";
import type { CandidateResult } from "../types/eleicoes";

interface UseSqCandidatosComparacaoProps {
  candidatoA: CandidateResult | undefined;
  candidatoB: CandidateResult | undefined;
  ano: number;
  turno: number;
  cargo: number | null;
  habilitado?: boolean;
}

interface SqCandidatos {
  candidatoA: string | null;
  candidatoB: string | null;
}

const ESTADO_VAZIO: SqCandidatos = { candidatoA: null, candidatoB: null };

function normalizarNome(nome: string): string {
  return nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toUpperCase();
}

export function useSqCandidatosComparacao({
  candidatoA,
  candidatoB,
  ano,
  turno,
  cargo,
  habilitado = true,
}: UseSqCandidatosComparacaoProps) {
  const [identificadores, setIdentificadores] = useState<SqCandidatos>(ESTADO_VAZIO);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!habilitado || !candidatoA || !candidatoB || cargo === null) {
      setIdentificadores(ESTADO_VAZIO);
      setCarregando(false);
      setErro(null);
      return;
    }

    if (candidatoA.candidateId === candidatoB.candidateId) {
      setIdentificadores(ESTADO_VAZIO);
      setErro("Selecione dois candidatos diferentes.");
      return;
    }

    let cancelado = false;

    async function resolverIdentificadores() {
      try {
        setCarregando(true);
        setErro(null);

        async function resolver(candidato: CandidateResult): Promise<string> {
          const resposta = await getCandidatos({
            ano,
            turno,
            cargo: cargo as number,
            numero: String(candidato.candidateNumber),
            pagina: 1,
            limite: 100,
          });

          const nomeEsperado = normalizarNome(candidato.candidateName);
          const correspondencias = resposta.items.filter((item) => {
            const nomeOficial = normalizarNome(item.candidateName);
            const nomeUrna = normalizarNome(item.ballotName ?? "");
            return (
              item.officeCode === cargo &&
              item.candidateNumber === String(candidato.candidateNumber) &&
              (nomeOficial === nomeEsperado || nomeUrna === nomeEsperado)
            );
          });

          if (correspondencias.length !== 1) {
            throw new Error(`Não foi possível identificar o candidato ${candidato.candidateName}.`);
          }
          return correspondencias[0].sqCandidato;
        }

       const [sqA, sqB] = await Promise.all([
  resolver(candidatoA!), 
  resolver(candidatoB!)  
]);

        if (!cancelado) {
          setIdentificadores({ candidatoA: sqA, candidatoB: sqB });
        }
      } catch (error) {
        if (!cancelado) {
          setIdentificadores(ESTADO_VAZIO);
          setErro(error instanceof Error ? error.message : "Erro ao identificar candidatos.");
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    resolverIdentificadores();
    return () => { cancelado = true; };
  }, [habilitado, candidatoA, candidatoB, ano, turno, cargo]);

  return { ...identificadores, carregando, erro };
}