
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "./Dashboard.css";

import { getResultados } from "../services/resultadosService";
import { getMunicipios } from "../services/municipiosService";
import type { Municipio } from "../services/municipiosService";
import { formatarNumero } from "../utils/formatadores";
import type { ElectionResult, OfficeResult } from "../types/eleicoes";

const CORES_GRAFICO = ["#C92071", "#B5B6F2", "#F6AA1C"];

export default function Dashboard() {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [municipioSelecionado, setMunicipioSelecionado] = useState("");
  const [anoSelecionado, setAnoSelecionado] = useState(2022);
  const [turnoSelecionado, setTurnoSelecionado] = useState(1);

  const [resultado, setResultado] = useState<ElectionResult | null>(null);
  const [cargoSelecionado, setCargoSelecionado] = useState<number>(3);

  const [carregandoMunicipios, setCarregandoMunicipios] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Carrega os 184 municípios ao abrir o Dashboard.
  useEffect(() => {
    async function carregarMunicipios() {
      try {
        setCarregandoMunicipios(true);
        setErro(null);

        const dados = await getMunicipios();

        setMunicipios(dados);

        const araripe = dados.find(
          (municipio) => municipio.tseCode === "13250",
        );

        setMunicipioSelecionado(
          araripe?.tseCode ?? dados[0]?.tseCode ?? "",
        );
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os municípios.",
        );
      } finally {
        setCarregandoMunicipios(false);
      }
    }

    carregarMunicipios();
  }, []);

  // Consulta os resultados sempre que os filtros mudarem.
  useEffect(() => {
    if (!municipioSelecionado) return;

    let cancelado = false;

    async function carregarResultados() {
      try {
        setCarregando(true);
        setErro(null);
        setResultado(null);

        const dados = await getResultados(
          municipioSelecionado,
          anoSelecionado,
          turnoSelecionado,
        );

        if (cancelado) return;

        setResultado(dados);

        if (
          !dados.offices.some(
            (office) => office.officeCode === cargoSelecionado,
          )
        ) {
          setCargoSelecionado(
            dados.offices[0]?.officeCode ?? 3,
          );
        }
      } catch (error) {
        if (cancelado) return;

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os resultados.",
        );
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    carregarResultados();

    return () => {
      cancelado = true;
    };
  }, [
    municipioSelecionado,
    anoSelecionado,
    turnoSelecionado,
  ]);

  const cargo: OfficeResult | undefined = resultado?.offices.find(
    (office) => office.officeCode === cargoSelecionado,
  );

  const candidatosOrdenados = cargo
    ? [...cargo.candidates]
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 10)
    : [];

  const dadosVotacao = cargo
    ? [
        { name: "Votos válidos", value: cargo.validVotes },
        { name: "Votos em branco", value: cargo.blankVotes },
        { name: "Votos nulos", value: cargo.nullVotes },
      ]
    : [];

  return (
    <section className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard Eleitoral</h1>
        <p>Visão geral dos resultados eleitorais do Ceará.</p>
      </header>

      <div className="dashboard-info">
        <div>
          <h2>
            {resultado?.municipalityName ??
              "Consulta eleitoral"}
          </h2>

          <p>
            Eleições de {anoSelecionado} — {turnoSelecionado}º turno
          </p>
        </div>

        <div className="dashboard-filter">
          <label htmlFor="municipio">Município</label>
          <select
            id="municipio"
            value={municipioSelecionado}
            onChange={(event) =>
              setMunicipioSelecionado(event.target.value)
            }
            disabled={carregandoMunicipios}
          >
            {municipios.map((municipio) => (
              <option
                key={municipio.ibgeCode}
                value={municipio.tseCode}
              >
                {municipio.ibgeName}
              </option>
            ))}
          </select>
        </div>

        <div className="dashboard-filter">
          <label htmlFor="ano">Ano eleitoral</label>
          <input
            id="ano"
            type="number"
            min="1900"
            max="2100"
            value={anoSelecionado}
            onChange={(event) =>
              setAnoSelecionado(Number(event.target.value))
            }
          />
        </div>

        <div className="dashboard-filter">
          <label htmlFor="turno">Turno</label>
          <select
            id="turno"
            value={turnoSelecionado}
            onChange={(event) =>
              setTurnoSelecionado(Number(event.target.value))
            }
          >
            <option value={1}>1º turno</option>
            <option value={2}>2º turno</option>
          </select>
        </div>

        {resultado && (
          <div className="dashboard-filter">
            <label htmlFor="cargo">Cargo eleitoral</label>
            <select
              id="cargo"
              value={cargoSelecionado}
              onChange={(event) =>
                setCargoSelecionado(Number(event.target.value))
              }
            >
              {resultado.offices.map((office) => (
                <option
                  key={office.officeCode}
                  value={office.officeCode}
                >
                  {office.officeName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {carregandoMunicipios && (
        <p>Carregando municípios...</p>
      )}

      {carregando && (
        <p>Carregando resultados eleitorais...</p>
      )}

      {erro && <p role="alert">Erro: {erro}</p>}

      {resultado && cargo && !carregando && (
        <>
          <div className="dashboard-stats">
            <article className="stat-card">
              <span>Votos válidos</span>
              <strong>{formatarNumero(cargo.validVotes)}</strong>
            </article>

            <article className="stat-card">
              <span>Votos nominais</span>
              <strong>{formatarNumero(cargo.nominalVotes)}</strong>
            </article>

            <article className="stat-card">
              <span>Votos em branco</span>
              <strong>{formatarNumero(cargo.blankVotes)}</strong>
            </article>

            <article className="stat-card">
              <span>Votos nulos</span>
              <strong>{formatarNumero(cargo.nullVotes)}</strong>
            </article>
          </div>

          <div className="ranking-section">
            <div className="ranking-header">
              <h2>Ranking de candidatos</h2>
              <span>{cargo.officeName}</span>
            </div>

            <div className="ranking-list">
              {candidatosOrdenados.map((candidato, index) => (
                <article
                  className="ranking-item"
                  key={candidato.candidateId}
                >
                  <div className="ranking-position">
                    {index + 1}º
                  </div>

                  <div className="ranking-details">
                    <div className="ranking-candidate">
                      <strong>{candidato.candidateName}</strong>
                      <span>{candidato.partyAbbreviation}</span>
                    </div>

                    <div className="ranking-progress">
                      <div
                        className="ranking-progress-bar"
                        style={{
                          width: `${Math.min(candidato.percentage, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="ranking-votes">
                    <strong>
                      {formatarNumero(candidato.votes)}
                    </strong>
                    <span>
                      {candidato.percentage.toFixed(2).replace(".", ",")}%
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="dashboard-charts">
            <article className="chart-card">
              <h2>Votação por candidato</h2>
              <p>Os dez candidatos mais votados</p>

              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={candidatosOrdenados}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                  />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="candidateName"
                    width={130}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="votes"
                    name="Votos"
                    fill="#C92071"
                    radius={[0, 5, 5, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </article>

            <article className="chart-card">
              <h2>Composição da votação</h2>
              <p>Votos válidos, brancos e nulos</p>

              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={dadosVotacao}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={105}
                    innerRadius={65}
                    paddingAngle={3}
                    label
                  >
                    {dadosVotacao.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={CORES_GRAFICO[index]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </article>
          </div>
        </>
      )}
    </section>
  );
}
