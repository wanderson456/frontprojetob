import { useCallback, useEffect, useState } from "react";


import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  GeoJSON,
} from "react-leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Layer, PathOptions } from "leaflet";

import "leaflet/dist/leaflet.css";
import "./MapaEleitoral.css";

import {
  getCandidatoMapaGeografico,
} from "../services/candidatosService";
import { getSectionVotes } from "../services/api";
import { getMunicipioSecoes } from "../services/secoesService";
import TabelaSecoes from "../components/mapa-eleitoral/TabelaSecoes";
import FiltrosMapa from "../components/mapa-eleitoral/FiltrosMapa";
import IndicadoresMapa from "../components/mapa-eleitoral/IndicadoresMapa";
import MapaHeader from "../components/mapa-eleitoral/MapaHeader";
import PainelSecoes from "../components/mapa-eleitoral/PainelSecoes";
import { useCandidatos } from "../hooks/useCandidatos";

import type {
  CandidateGeoMunicipality,
  SectionItem,
  SectionVoteItem,
} from "../types/eleicoes";




interface MunicipioFeatureProperties {
  codarea: string;
}

type MunicipioFeature = Feature<Geometry, MunicipioFeatureProperties>;
type MalhaMunicipal = FeatureCollection<Geometry, MunicipioFeatureProperties>;
type ModoVisualizacao = "circulos" | "municipios";

const ANO = 2022;
const TURNO = 1;

const LIMITE_MUNICIPIOS = 100;

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
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");


  const [municipios, setMunicipios] = useState<CandidateGeoMunicipality[]>([]);
  const [malha, setMalha] = useState<MalhaMunicipal | null>(null);
  const [modo, setModo] = useState<ModoVisualizacao>("municipios");

  const [municipioSelecionado, setMunicipioSelecionado] =
    useState<CandidateGeoMunicipality | null>(null);
  const [secoes, setSecoes] = useState<SectionItem[]>([]);
  const [secoesMapa, setSecoesMapa] = useState<SectionItem[]>([]);
  const [secaoSelecionada, setSecaoSelecionada] = useState<SectionItem | null>(null);

  const [painelSecoesAberto, setPainelSecoesAberto] = useState(false);
  const [votosSecao, setVotosSecao] = useState<SectionVoteItem[]>([]);
  const [carregandoVotosSecao, setCarregandoVotosSecao] = useState(false);
  const [erroVotosSecao, setErroVotosSecao] = useState("");

  const [totalSecoes, setTotalSecoes] = useState(0);
  const [paginaSecoes, setPaginaSecoes] = useState(1);
  const [totalPaginasSecoes, setTotalPaginasSecoes] = useState(1);
  const [carregandoSecoes, setCarregandoSecoes] = useState(false);
  const [erroSecoes, setErroSecoes] = useState("");

  const [totalMunicipios, setTotalMunicipios] = useState(0);

  const [carregandoMapa, setCarregandoMapa] = useState(false);
  const [erro, setErro] = useState("");
  const [paginaCandidatos, setPaginaCandidatos] = useState(1);

  const limparMapaAntesDeCarregar = useCallback(() => {
    setMunicipios([]);
    setTotalMunicipios(0);
  }, []);

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
    onAntesDeCarregar: limparMapaAntesDeCarregar,
  });
  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      setBuscaDebounced(busca);
      setPaginaCandidatos(1);
    }, 400);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [busca]);

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
          setErro(
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



  useEffect(() => {
    if (!candidato) {
      setMunicipios([]);
      setTotalMunicipios(0);
      return;
    }

    let cancelado = false;

    async function carregarMapa() {
      try {
        setCarregandoMapa(true);
        setErro("");

        const primeiraPagina = await getCandidatoMapaGeografico(
          candidato!.sqCandidato,
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
                candidato!.sqCandidato,
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
            ...demaisPaginas.flatMap((pagina) => pagina.municipalities),
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
  }, [candidato]);

  const votosPorMunicipio = new Map(
    municipios.map((municipio) => [municipio.ibgeCode, municipio]),
  );

  const municipiosComCoordenadas = municipios.filter(
    (municipio) =>
      municipio.latitude !== null && municipio.longitude !== null,
  );

  const totalVotos = municipios.reduce(
    (total, municipio) => total + municipio.votes,
    0,
  );

  const maiorVotacao = Math.max(
    ...municipios.map((municipio) => municipio.votes),
    1,
  );

  const municipiosComVotos = municipios.filter(
    (municipio) => municipio.votes > 0,
  ).length;

  function calcularRaio(votos: number) {
    return 5 + Math.sqrt(votos / maiorVotacao) * 17;
  }

  function obterCor(votos: number): string {
    if (votos === 0) return "#f1f5f9";

    const proporcao = votos / maiorVotacao;

    if (proporcao >= 0.6) return "#7a123f";
    if (proporcao >= 0.3) return "#991956";
    if (proporcao >= 0.1) return "#C92071";
    if (proporcao >= 0.03) return "#e879a8";

    return "#f3b5ce";
  }

  function estilizarMunicipio(
    feature?: Feature<Geometry, MunicipioFeatureProperties>,
  ): PathOptions {
    const codigo = feature?.properties?.codarea;
    const municipio = codigo
      ? votosPorMunicipio.get(String(codigo))
      : undefined;

    return {
      fillColor: obterCor(municipio?.votes ?? 0),
      weight: 1,
      opacity: 1,
      color: "#ffffff",
      fillOpacity: 0.85,
    };
  }

  function configurarInteracao(feature: MunicipioFeature, layer: Layer) {
    const municipio = votosPorMunicipio.get(
      String(feature.properties.codarea),
    );

    if (!municipio) return;

    layer.bindPopup(`
      <div class="mapa-popup">
        <strong>${municipio.municipality}</strong>
        <span>Votos: ${municipio.votes.toLocaleString("pt-BR")}</span>
        <small>Código IBGE: ${municipio.ibgeCode}</small>
      </div>
    `);

    layer.on({
      click: () => {
        void carregarSecoes(municipio, 1);
      },
      mouseover: (event) => {
        event.target.setStyle({
          weight: 2,
          color: "#991956",
          fillOpacity: 1,
        });
      },
      mouseout: (event) => {
        event.target.setStyle(estilizarMunicipio(feature));
      },
    });
  }

  async function carregarSecoes(
    municipio: CandidateGeoMunicipality,
    pagina: number = 1,
  ) {
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
          limite: 20,
        }),
        getMunicipioSecoes({
          municipalityCode: municipio.ibgeCode,
          sqCandidato: candidato.sqCandidato,
          ano: ANO,
          turno: TURNO,
          pagina: 1,
          limite: 100,
        }),
      ]);

      const demaisPaginasMapa = await Promise.all(
        Array.from(
          { length: Math.max(0, primeiraPaginaMapa.totalPages - 1) },
          (_, index) =>
            getMunicipioSecoes({
              municipalityCode: municipio.ibgeCode,
              sqCandidato: candidato.sqCandidato,
              ano: ANO,
              turno: TURNO,
              pagina: index + 2,
              limite: 100,
            }),
        ),
      );

      setSecoes(respostaTabela.items);
      setTotalSecoes(respostaTabela.total);
      setTotalPaginasSecoes(respostaTabela.totalPages);
      setSecoesMapa([
        ...primeiraPaginaMapa.items,
        ...demaisPaginasMapa.flatMap((item) => item.items),
      ]);
    } catch (error) {
      setSecoes([]);
      setSecoesMapa([]);
      setTotalSecoes(0);
      setTotalPaginasSecoes(1);
      setErroSecoes(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as seções do município.",
      );
    } finally {
      setCarregandoSecoes(false);
    }
  }

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
        limite: 100,
      });

      const demaisPaginas = await Promise.all(
        Array.from(
          { length: Math.max(0, primeiraPagina.totalPages - 1) },
          (_, index) =>
            getSectionVotes({
              municipalityCode: municipalityTseCode,
              zone: secao.zone,
              section: secao.section,
              ano: ANO,
              turno: TURNO,
              pagina: index + 2,
              limite: 100,
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



  const locaisVotacao = Array.from(
    secoesMapa.reduce(
      (locais, secao) => {
        if (secao.latitude === null || secao.longitude === null) {
          return locais;
        }

        const chave =
          secao.pollingPlaceNumber !== null
            ? `local-${secao.pollingPlaceNumber}`
            : `coord-${secao.latitude}-${secao.longitude}`;

        const local = locais.get(chave) ?? {
          pollingPlaceNumber: secao.pollingPlaceNumber,
          pollingPlaceName: secao.pollingPlaceName,
          pollingPlaceAddress: secao.pollingPlaceAddress,
          latitude: secao.latitude,
          longitude: secao.longitude,
          secoes: [] as SectionItem[],
        };

        local.secoes.push(secao);
        locais.set(chave, local);

        return locais;
      },
      new Map<
        string,
        {
          pollingPlaceNumber: number | null;
          pollingPlaceName: string | null;
          pollingPlaceAddress: string | null;
          latitude: number;
          longitude: number;
          secoes: SectionItem[];
        }
      >(),
    ).values(),
  );


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

          <div className="mapa-container">
            <MapContainer
              key={`${candidato.sqCandidato}-${municipioSelecionado?.ibgeCode ?? "ceara"}`}
              center={(
                municipioSelecionado && municipioSelecionado.latitude !== null && municipioSelecionado.longitude !== null
                  ? [municipioSelecionado.latitude, municipioSelecionado.longitude]
                  : [-5.2, -39.5]
              ) as [number, number]}
              zoom={municipioSelecionado ? 12 : 7}
              minZoom={6}
              scrollWheelZoom
              className="mapa-leaflet"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {modo === "municipios" && (
                <GeoJSON
                  key={`${candidato.sqCandidato}-${modo}`}
                  data={malha}
                  style={estilizarMunicipio}
                  onEachFeature={configurarInteracao}
                />
              )}

              {modo === "circulos" &&
                municipiosComCoordenadas.map((municipio) => (
                  <CircleMarker
                    key={municipio.ibgeCode}
                    center={[municipio.latitude!, municipio.longitude!]}
                    radius={calcularRaio(municipio.votes)}
                    eventHandlers={{
                      click: () => void carregarSecoes(municipio, 1),
                    }}
                    pathOptions={{
                      color: "#991956",
                      fillColor: "#C92071",
                      fillOpacity: 0.65,
                      weight: 1,
                    }}
                  >
                    <Popup>
                      <div className="mapa-popup">
                        <strong>{municipio.municipality}</strong>
                        <span>
                          Votos: {municipio.votes.toLocaleString("pt-BR")}
                        </span>
                        <small>Código IBGE: {municipio.ibgeCode}</small>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}

              {municipioSelecionado && locaisVotacao.map((local) => (
                <CircleMarker
                  key={`${local.latitude}-${local.longitude}`}
                  center={[local.latitude, local.longitude]}
                  radius={8 + Math.min(local.secoes.length, 12)}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 2,
                    fillColor: "#991956",
                    fillOpacity: 0.9,
                  }}
                >

                  <Popup>
                    <div className="mapa-popup mapa-popup-local">
                      <strong>
                        {local.pollingPlaceName ?? "Local de votação não identificado"}
                      </strong>

                      {local.pollingPlaceNumber !== null && (
                        <span>
                          Local de votação: {local.pollingPlaceNumber}
                        </span>
                      )}

                      {local.pollingPlaceAddress && (
                        <small>{local.pollingPlaceAddress}</small>
                      )}

                      <span>
                        {local.secoes.length} seção(ões) neste local
                      </span>

                      <div className="mapa-popup-secoes">

                        {local.secoes.map((secao) => (
                          <button
                            key={`${secao.zone}-${secao.section}`}
                            type="button"
                            className="mapa-popup-secao"
                            onClick={() => void selecionarSecao(secao)}
                          >
                            <strong>
                              Zona {secao.zone} · Seção {secao.section}
                            </strong>
                            <span>
                              {secao.votes.toLocaleString("pt-BR")} votos
                            </span>
                          </button>
                        ))}

                      </div>
                    </div>
                  </Popup>

                </CircleMarker>
              ))}
            </MapContainer>

            {painelSecoesAberto && municipioSelecionado && (
              <PainelSecoes
                municipio={municipioSelecionado}
                secoes={secoesMapa}
                secaoSelecionada={secaoSelecionada}
                votosSecao={votosSecao}
                carregandoVotos={carregandoVotosSecao}
                erroVotos={erroVotosSecao}
                onFechar={() => setPainelSecoesAberto(false)}
                onSelecionarSecao={(secao) => void selecionarSecao(secao)}
              />
            )}

          </div>

          {municipioSelecionado && (
            <section className="mapa-secoes">
              <h2>Seções eleitorais — {municipioSelecionado.municipality}</h2>
              <p>
                Código IBGE: {municipioSelecionado.ibgeCode} ·
                Total de seções: {totalSecoes}
              </p>

              {carregandoSecoes && (
                <div className="mapa-mensagem">Carregando seções...</div>
              )}

              {erroSecoes && (
                <div className="mapa-erro">Erro ao carregar seções: {erroSecoes}</div>
              )}

              {!carregandoSecoes && !erroSecoes && (
                <>
                  {secoes.length > 0 ? (
                    <TabelaSecoes secoes={secoes} />
                  ) : (
                    <p>Nenhuma seção encontrada para este município.</p>
                  )}

                  <div className="mapa-paginacao">
                    <button
                      type="button"
                      disabled={paginaSecoes <= 1}
                      onClick={() => void carregarSecoes(municipioSelecionado, paginaSecoes - 1)}
                    >
                      Anterior
                    </button>
                    <span> Página {paginaSecoes} de {totalPaginasSecoes} </span>
                    <button
                      type="button"
                      disabled={paginaSecoes >= totalPaginasSecoes}
                      onClick={() => void carregarSecoes(municipioSelecionado, paginaSecoes + 1)}
                    >
                      Próxima
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          <p className="mapa-rodape">
            Fonte: API Eleições Ceará e malha territorial do IBGE.
            {` ${municipiosComCoordenadas.length} municípios possuem coordenadas.`}
          </p>
        </>
      )}
    </div>
  );
}
