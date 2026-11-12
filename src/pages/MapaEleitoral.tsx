import { useEffect, useState } from "react";
import { useMapaEleitoral } from "../hooks/useMapaEleitoral";
import { useMalhaMunicipal } from "../hooks/useMalhaMunicipal";

import type {
  ModoVisualizacao,
} from "../types/mapa";
import "leaflet/dist/leaflet.css";
import "./MapaEleitoral.css";
import FiltrosMapa from "../components/mapa-eleitoral/FiltrosMapa";
import IndicadoresMapa from "../components/mapa-eleitoral/IndicadoresMapa";
import MapaHeader from "../components/mapa-eleitoral/MapaHeader";
import PainelSecoes from "../components/mapa-eleitoral/PainelSecoes";
import { useCandidatos } from "../hooks/useCandidatos";
import { useSecoesMunicipio } from "../hooks/useSecoesMunicipio";
import { useVotosSecao } from "../hooks/useVotosSecao";
import MapaLeaflet from "../components/mapa-eleitoral/MapaLeaflet";

const ANO = 2022;



const CARGOS = [
  { codigo: 3, nome: "Governador" },
  { codigo: 4, nome: "Vice-governador" },
  { codigo: 5, nome: "Senador" },
  { codigo: 6, nome: "Deputado federal" },
  { codigo: 7, nome: "Deputado estadual" },
  { codigo: 9, nome: "1º suplente" },
  { codigo: 10, nome: "2º suplente" },
];

export default function MapaEleitoral() {
  const [cargo, setCargo] = useState(5);

  const {
    malha,
    erroMalha,
  } = useMalhaMunicipal();
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [modo, setModo] = useState<ModoVisualizacao>("municipios");
  const [paginaCandidatos, setPaginaCandidatos] = useState(1);

  const {
    candidatos,
    candidato,
    setCandidato,
    totalPaginasCandidatos,
    carregandoCandidatos,
    erroCandidatos,
  } = useCandidatos({
    cargo,
    busca: buscaDebounced,
    pagina: paginaCandidatos,

  });

  const {
    municipioSelecionado,
    secoesMapa,
    carregarSecoes,
  } = useSecoesMunicipio({
    candidato,
  });

  const {
    secaoSelecionada,
    painelSecoesAberto,
    votosSecao,
    carregandoVotosSecao,
    erroVotosSecao,
    selecionarSecao,
    fecharPainelSecoes,
  } = useVotosSecao();

  const {
    municipios,
    totalMunicipios,
    carregandoMapa,
    erro: erroMapa,
  } = useMapaEleitoral({
    sqCandidato: candidato?.sqCandidato ?? null,
  });

  const erro = erroMapa || erroMalha;
  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      setBuscaDebounced(busca);
      setPaginaCandidatos(1);
    }, 400);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [busca]);

  const municipiosComCoordenadas = municipios.filter(
    (municipio) =>
      municipio.latitude !== null && municipio.longitude !== null,
  );

  const totalVotos = municipios.reduce(
    (total, municipio) => total + municipio.votes,
    0,
  );

  const municipiosComVotos = municipios.filter(
    (municipio) => municipio.votes > 0,
  ).length;

  return (
    <div className="mapa-eleitoral">
      <MapaHeader
        ano={ANO}
        nomeCandidato={candidato?.candidateName ?? null}
      />

      <FiltrosMapa
        cargos={CARGOS}
        cargo={cargo}
        busca={busca}
        candidato={candidato}
        candidatos={candidatos}
        paginaCandidatos={paginaCandidatos}
        totalPaginasCandidatos={totalPaginasCandidatos}
        carregandoCandidatos={carregandoCandidatos}
        onCargoChange={(novoCargo) => {
          setCargo(novoCargo);
          setPaginaCandidatos(1);
        }}
        onBuscaChange={(novaBusca) => {
          setBusca(novaBusca);
          setPaginaCandidatos(1);
        }}
        onCandidatoChange={(sqCandidato) => {
          const selecionado = candidatos.find(
            (item) => item.sqCandidato === sqCandidato,
          );
          setCandidato(selecionado ?? null);
        }}
        onPaginaChange={setPaginaCandidatos}
      />

      {carregandoCandidatos && (
        <div className="mapa-mensagem">Carregando candidatos...</div>
      )}

      {erroCandidatos && (
        <div className="mapa-erro">Erro ao carregar candidatos: {erroCandidatos}</div>
      )}

      {candidato && (
        <section className="mapa-candidato-selecionado">
          <strong>{candidato.candidateName}</strong>
          <span>
            {candidato.partyAbbreviation ?? "Partido não informado"}
            {candidato.candidateNumber
              ? ` • Número ${candidato.candidateNumber}`
              : ""}
            {" • "}
            {candidato.officeName}
          </span>
        </section>
      )}

      <IndicadoresMapa
        totalMunicipios={totalMunicipios}
        municipiosComVotos={municipiosComVotos}
        totalVotos={totalVotos}
      />

      <div className="mapa-controles">
        <span>Visualização:</span>

        <button
          className={modo === "municipios" ? "ativo" : ""}
          onClick={() => setModo("municipios")}
        >
          Municípios coloridos
        </button>

        <button
          className={modo === "circulos" ? "ativo" : ""}
          onClick={() => setModo("circulos")}
        >
          Círculos proporcionais
        </button>
      </div>

      {carregandoMapa && (
        <div className="mapa-mensagem">
          Carregando votação de {candidato?.candidateName}...
        </div>
      )}

      {erro && <div className="mapa-erro">Erro ao carregar o mapa: {erro}</div>}


      {!carregandoMapa && !erro && malha && candidato && (
        <>
          <div className="mapa-legenda">
            {modo === "municipios" ? (
              <>
                <span>Menor votação</span>
                {["#f3b5ce", "#e879a8", "#C92071", "#991956", "#7a123f"].map(
                  (cor) => (
                    <span
                      key={cor}
                      className="legenda-cor"
                      style={{ backgroundColor: cor }}
                    />
                  ),
                )}
                <span>Maior votação</span>
              </>
            ) : (
              <>
                <span className="legenda-circulo" />
                <span>Tamanho dos círculos proporcional aos votos.</span>
              </>
            )}
          </div>


          <div
            className={`mapa-layout ${painelSecoesAberto && municipioSelecionado ? "com-painel" : ""
              }`}
          >
            <div className="mapa-container">
              <MapaLeaflet
                candidatoId={candidato.sqCandidato}
                malha={malha}
                municipios={municipios}
                municipiosComCoordenadas={municipiosComCoordenadas}
                secoesMapa={secoesMapa}
                municipioSelecionado={municipioSelecionado}
                modo={modo}
                onSelecionarMunicipio={(municipio) => {
                  void carregarSecoes(municipio, 1);
                }}
                onSelecionarSecao={(secao) => {
                  void selecionarSecao(secao);
                }}
              />
            </div>

            {painelSecoesAberto && municipioSelecionado && (
              <PainelSecoes
                municipio={municipioSelecionado}
                secoes={secoesMapa}
                secaoSelecionada={secaoSelecionada}
                votosSecao={votosSecao}
                carregandoVotos={carregandoVotosSecao}
                erroVotos={erroVotosSecao}
                onFechar={fecharPainelSecoes}
                onSelecionarSecao={(secao) => void selecionarSecao(secao)}
              />
            )}
          </div>


          <p className="mapa-rodape">
            Fonte: API Eleições Ceará e malha territorial do IBGE.
            {` ${municipiosComCoordenadas.length} municípios possuem coordenadas.`}
          </p>
        </>
      )
      }
    </div >
  );
}


