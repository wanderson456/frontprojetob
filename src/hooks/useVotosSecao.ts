
import { useState } from "react";

import { getSectionVotes } from "../services/api";

import type {
  SectionItem,
  SectionVoteItem,
} from "../types/eleicoes";

const ANO = 2022;
const TURNO = 1;
const LIMITE_VOTOS = 100;

export function useVotosSecao() {
  const [secaoSelecionada, setSecaoSelecionada] =
    useState<SectionItem | null>(null);

  const [painelSecoesAberto, setPainelSecoesAberto] = useState(false);
  const [votosSecao, setVotosSecao] = useState<SectionVoteItem[]>([]);
  const [carregandoVotosSecao, setCarregandoVotosSecao] = useState(false);
  const [erroVotosSecao, setErroVotosSecao] = useState("");

  async function selecionarSecao(secao: SectionItem) {
    if (!secao.municipalityTseCode) {
      setErroVotosSecao("Código TSE do município não informado.");
      setPainelSecoesAberto(true);
      return;
    }

    const municipalityTseCode = secao.municipalityTseCode;

    setSecaoSelecionada(secao);
    setPainelSecoesAberto(true);
    setVotosSecao([]);
    setErroVotosSecao("");
    setCarregandoVotosSecao(true);

    try {
      const primeiraPagina = await getSectionVotes({
        municipalityCode: municipalityTseCode,
        zone: secao.zone,
        section: secao.section,
        ano: ANO,
        turno: TURNO,
        pagina: 1,
        limite: LIMITE_VOTOS,
      });

      const demaisPaginas = await Promise.all(
        Array.from(
          {
            length: Math.max(0, primeiraPagina.totalPages - 1),
          },
          (_, index) =>
            getSectionVotes({
              municipalityCode: municipalityTseCode,
              zone: secao.zone,
              section: secao.section,
              ano: ANO,
              turno: TURNO,
              pagina: index + 2,
              limite: LIMITE_VOTOS,
            }),
        ),
      );

      setVotosSecao([
        ...primeiraPagina.items,
        ...demaisPaginas.flatMap((pagina) => pagina.items),
      ]);
    } catch (error) {
      setVotosSecao([]);
      setErroVotosSecao(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os votos desta seção.",
      );
    } finally {
      setCarregandoVotosSecao(false);
    }
  }

  function fecharPainelSecoes() {
    setPainelSecoesAberto(false);
  }

  return {
    secaoSelecionada,
    painelSecoesAberto,
    votosSecao,
    carregandoVotosSecao,
    erroVotosSecao,
    selecionarSecao,
    fecharPainelSecoes,
  };
}
