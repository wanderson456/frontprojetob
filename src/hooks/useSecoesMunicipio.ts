import { useState, useEffect } from "react";
import { getMunicipioSecoes } from "../services/secoesService";
import type { CandidateGeoMunicipality, CandidateListItem, SectionItem } from "../types/eleicoes";

interface UseSecoesMunicipioProps {
  candidato: CandidateListItem | null;
}

const ANO = 2022;
const TURNO = 1;
const LIMITE_TABELA = 20;
const LIMITE_MAPA = 100;

export function useSecoesMunicipio({ candidato }: UseSecoesMunicipioProps) {
  const [municipioSelecionado, setMunicipioSelecionado] = useState<CandidateGeoMunicipality | null>(null);
  const [secoes, setSecoes] = useState<SectionItem[]>([]);
  const [secoesMapa, setSecoesMapa] = useState<SectionItem[]>([]);
  const [totalSecoes, setTotalSecoes] = useState(0);
  const [paginaSecoes, setPaginaSecoes] = useState(1);
  const [totalPaginasSecoes, setTotalPaginasSecoes] = useState(1);
  const [carregandoSecoes, setCarregandoSecoes] = useState(false);
  const [erroSecoes, setErroSecoes] = useState("");

  // LIMPA O ESTADO QUANDO O CANDIDATO MUDA
  const sqCandidato = candidato?.sqCandidato;
  useEffect(() => {
    setMunicipioSelecionado(null);
    setSecoes([]);
    setSecoesMapa([]);
    setTotalSecoes(0);
    setPaginaSecoes(1);
    setTotalPaginasSecoes(1);
    setErroSecoes("");
  }, [sqCandidato]);

  async function carregarSecoes(municipio: CandidateGeoMunicipality, pagina: number = 1) {
    if (!candidato) return;

    try {
      setMunicipioSelecionado(municipio);
      setCarregandoSecoes(true);
      setErroSecoes("");
      setPaginaSecoes(pagina);

      const [respostaTabela, primeiraPaginaMapa] = await Promise.all([
        getMunicipioSecoes({
          municipalityCode: municipio.ibgeCode,
          sqCandidato: candidato.sqCandidato,
          ano: ANO,
          turno: TURNO,
          pagina,
          limite: LIMITE_TABELA,
        }),
        getMunicipioSecoes({
          municipalityCode: municipio.ibgeCode,
          sqCandidato: candidato.sqCandidato,
          ano: ANO,
          turno: TURNO,
          pagina: 1,
          limite: LIMITE_MAPA,
        }),
      ]);

      const demaisPaginasMapa = await Promise.all(
        Array.from({ length: Math.max(0, primeiraPaginaMapa.totalPages - 1) }, (_, index) =>
          getMunicipioSecoes({
            municipalityCode: municipio.ibgeCode,
            sqCandidato: candidato.sqCandidato,
            ano: ANO,
            turno: TURNO,
            pagina: index + 2,
            limite: LIMITE_MAPA,
          })
        )
      );

      setSecoes(respostaTabela.items);
      setTotalSecoes(respostaTabela.total);
      setTotalPaginasSecoes(respostaTabela.totalPages);
      
      // 👇 TIPAGEM CORRETA NO FLATMAP
      setSecoesMapa([
        ...primeiraPaginaMapa.items, 
        ...demaisPaginasMapa.flatMap((pagina) => pagina.items)
      ]);
    } catch (error) {
      setSecoes([]);
      setSecoesMapa([]);
      setTotalSecoes(0);
      setTotalPaginasSecoes(1);
      setErroSecoes(error instanceof Error ? error.message : "Não foi possível carregar as seções do município.");
    } finally {
      setCarregandoSecoes(false);
    }
  }

  return {
    municipioSelecionado,
    secoes,
    secoesMapa,
    totalSecoes,
    paginaSecoes,
    totalPaginasSecoes,
    carregandoSecoes,
    erroSecoes,
    carregarSecoes,
  };
}