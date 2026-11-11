
import { useEffect, useState } from "react";
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
  getCandidatos,
  getCandidatoMapaGeografico,
} from "../services/candidatosService";
import { getMunicipioSecoes } from "../services/secoesService";

import type {
  CandidateGeoMunicipality,
  CandidateListItem,
  SectionItem,
} from "../types/eleicoes";




interface MunicipioFeatureProperties {
  codarea: string;
}

type MunicipioFeature = Feature<Geometry, MunicipioFeatureProperties>;
type MalhaMunicipal = FeatureCollection<Geometry, MunicipioFeatureProperties>;
type ModoVisualizacao = "circulos" | "municipios";

const ANO = 2022;
const TURNO = 1;
const LIMITE_CANDIDATOS = 100;
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

  const [candidatos, setCandidatos] = useState<CandidateListItem[]>([]);
  const [candidato, setCandidato] = useState<CandidateListItem | null>(null);
  const [paginaCandidatos, setPaginaCandidatos] = useState(1);
  const [totalPaginasCandidatos, setTotalPaginasCandidatos] = useState(1);

  const [municipios, setMunicipios] = useState<CandidateGeoMunicipality[]>([]);
  const [malha, setMalha] = useState<MalhaMunicipal | null>(null);
  const [modo, setModo] = useState<ModoVisualizacao>("municipios");

  const [municipioSelecionado, setMunicipioSelecionado] =
    useState<CandidateGeoMunicipality | null>(null);
  const [secoes, setSecoes] = useState<SectionItem[]>([]);
  const [totalSecoes, setTotalSecoes] = useState(0);
  const [paginaSecoes, setPaginaSecoes] = useState(1);
  const [totalPaginasSecoes, setTotalPaginasSecoes] = useState(1);
  const [carregandoSecoes, setCarregandoSecoes] = useState(false);
  const [erroSecoes, setErroSecoes] = useState("");

  const [totalMunicipios, setTotalMunicipios] = useState(0);
  const [carregandoCandidatos, setCarregandoCandidatos] = useState(false);
  const [carregandoMapa, setCarregandoMapa] = useState(false);
  const [erro, setErro] = useState("");
  const [erroCandidatos, setErroCandidatos] = useState("");

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
    let cancelado = false;

    async function carregarCandidatos() {
      try {
        setCarregandoCandidatos(true);
        setErroCandidatos("");
        setCandidato(null);
        setMunicipios([]);
        setTotalMunicipios(0);

        const resposta = await getCandidatos({
          ano: ANO,
          turno: TURNO,
          cargo,
          busca: buscaDebounced.trim() || undefined,
          pagina: paginaCandidatos,
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
  }, [cargo, buscaDebounced, paginaCandidatos]);

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

      const resposta = await getMunicipioSecoes({
        municipalityCode: municipio.ibgeCode,
        sqCandidato: candidato.sqCandidato,
        ano: ANO,
        turno: TURNO,
        pagina,
        limite: 20,
      });

      setSecoes(resposta.items);
      setTotalSecoes(resposta.total);
      setTotalPaginasSecoes(resposta.totalPages);
    } catch (error) {
      setSecoes([]);
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

  return (
    <div className="mapa-eleitoral">
      <header className="mapa-header">
        <div>
          <span className="mapa-subtitulo">DISTRIBUIÇÃO GEOGRÁFICA</span>
          <h1>Mapa Eleitoral do Ceará</h1>
          <p>
            {candidato
              ? `Distribuição dos votos de ${candidato.candidateName} nas eleições de ${ANO}.`
              : "Selecione um candidato para visualizar sua votação."}
          </p>
        </div>

        <div className="mapa-periodo">
          <strong>{ANO}</strong>
          <span>1º turno</span>
        </div>
      </header>

      <section className="mapa-filtros">
        <div className="mapa-filtro">
          <label htmlFor="cargo">Cargo</label>
          <select
            id="cargo"
            value={cargo}
            onChange={(event) => {
              setCargo(Number(event.target.value));
              setPaginaCandidatos(1);
            }}
          >
            {CARGOS.map((item) => (
              <option key={item.codigo} value={item.codigo}>
                {item.nome}
              </option>
            ))}
          </select>
        </div>


        <div className="mapa-filtro">
          <label htmlFor="busca-candidato">Pesquisar candidato</label>
          <input
            id="busca-candidato"
            type="search"
            value={busca}
            onChange={(event) => {
              setBusca(event.target.value);
              setPaginaCandidatos(1);
            }}
            placeholder="Nome ou número do candidato..."
          />
        </div>

        <div className="mapa-filtro">
          <label htmlFor="candidato">Candidato</label>
          <select
            id="candidato"
            value={candidato?.sqCandidato ?? ""}
            disabled={carregandoCandidatos || candidatos.length === 0}
            onChange={(event) => {
              const selecionado = candidatos.find(
                (item) => item.sqCandidato === event.target.value,
              );
              setCandidato(selecionado ?? null);
            }}
          >
            {candidatos.length === 0 && (
              <option value="">Nenhum candidato encontrado</option>
            )}

            {candidatos.map((item) => (
              <option key={item.sqCandidato} value={item.sqCandidato}>
                {item.candidateName} — {item.partyAbbreviation ?? "Sem partido"}
                {item.candidateNumber ? ` (${item.candidateNumber})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="mapa-paginacao">
          <button
            type="button"
            disabled={paginaCandidatos <= 1 || carregandoCandidatos}
            onClick={() => setPaginaCandidatos((pagina) => pagina - 1)}
          >
            Anterior
          </button>

          <span>
            Página {paginaCandidatos} de {totalPaginasCandidatos}
          </span>

          <button
            type="button"
            disabled={
              paginaCandidatos >= totalPaginasCandidatos ||
              carregandoCandidatos
            }
            onClick={() => setPaginaCandidatos((pagina) => pagina + 1)}
          >
            Próxima
          </button>
        </div>
      </section>

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

      <section className="mapa-indicadores">
        <article className="mapa-card">
          <span>Municípios encontrados</span>
          <strong>{totalMunicipios}</strong>
        </article>

        <article className="mapa-card">
          <span>Municípios com votos</span>
          <strong>{municipiosComVotos}</strong>
        </article>

        <article className="mapa-card">
          <span>Total de votos</span>
          <strong>{totalVotos.toLocaleString("pt-BR")}</strong>
        </article>
      </section>

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
              center={[-5.2, -39.5]}
              zoom={7}
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
            </MapContainer>
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
                    <div className="mapa-tabela-container">
                      <table className="mapa-tabela">
                        <thead>
                          <tr>
                            <th>Zona</th>
                            <th>Seção</th>
                            <th>Votos</th>
                            <th>Latitude</th>
                            <th>Longitude</th>
                          </tr>
                        </thead>
                        <tbody>
                          {secoes.map((secao) => (
                            <tr key={`${secao.zone}-${secao.section}`}>
                              <td>{secao.zone}</td>
                              <td>{secao.section}</td>
                              <td>{secao.votes.toLocaleString("pt-BR")}</td>
                              <td>{secao.latitude ?? "—"}</td>
                              <td>{secao.longitude ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
