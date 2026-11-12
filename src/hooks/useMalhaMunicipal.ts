
import { useEffect, useState } from "react";

import type { MalhaMunicipal } from "../types/mapa";

export function useMalhaMunicipal() {
  const [malha, setMalha] = useState<MalhaMunicipal | null>(null);
  const [erroMalha, setErroMalha] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function carregarMalha() {
      try {
        const resposta = await fetch("/municipios-ceara.geojson");

        if (!resposta.ok) {
          throw new Error("Não foi possível carregar a malha municipal.");
        }

        const dados = (await resposta.json()) as MalhaMunicipal;

        if (!cancelado) {
          setMalha(dados);
        }
      } catch (error) {
        if (!cancelado) {
          setErroMalha(
            error instanceof Error
              ? error.message
              : "Erro ao carregar a malha municipal.",
          );
        }
      }
    }

    carregarMalha();

    return () => {
      cancelado = true;
    };
  }, []);

  return {
    malha,
    erroMalha,
  };
}
