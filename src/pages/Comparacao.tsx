import { useEffect, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import "./Comparacao.css";

import { getMunicipios } from "../services/municipiosService";
import type { Municipio } from "../services/municipiosService";
import { getResultados } from "../services/resultadosService";

import type {
  CandidateResult, ElectionResult, OfficeResult,
} from "../types/eleicoes";

import { formatarNumero } from "../utils/formatadores";

import { useComparacaoGeografica } from "../hooks/useComparacaoGeografica";
import { useSqCandidatosComparacao } from "../hooks/useSqCandidatosComparacao";
import { useMalhaMunicipal } from "../hooks/useMalhaMunicipal";
import { useSecoesMunicipio } from "../hooks/useSecoesMunicipio";
import { useVotosSecao } from "../hooks/useVotosSecao";

import MapaLeaflet from "../components/mapa-eleitoral/MapaLeaflet";
import PainelSecoes from "../components/mapa-eleitoral/PainelSecoes";

const CORES = ["#C92071", "#B5B6F2"];
type AbaComparacao = "votos" | "geografica";

function formatarPercentual(valor: number) {
  return `${valor.toFixed(2).replace(".", ",")}%`;
}

export default function Comparacao() {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [municipioSelecionado, setMunicipioSelecionado] = useState("");
  const [anoSelecionado, setAnoSelecionado] = useState(2022);
  const [turnoSelecionado, setTurnoSelecionado] = useState(1);
  const [cargoSelecionado, setCargoSelecionado] = useState<number | null>(null);
  const [candidatoAId, setCandidatoAId] = useState("");
  const [candidatoBId, setCandidatoBId] = useState("");
  const [abaAtiva, setAbaAtiva] = useState<AbaComparacao>("votos");

  const [resultado, setResultado] = useState<ElectionResult | null>(null);
  const [carregandoMunicipios, setCarregandoMunicipios] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    async function carregarMunicipios() {
      try {
        setErro(null);
        const dados = await getMunicipios();
        if (cancelado) return;
        setMunicipios(dados);
        const araripe = dados.find((m) => m.tseCode === "13250");
        setMunicipioSelecionado(araripe?.tseCode ?? dados[0]?.tseCode ?? "");
      } catch (error) {
        if (cancelado) return;
        setErro(error instanceof Error ? error.message : "Erro ao carregar municípios.");
      } finally {
        if (!cancelado) setCarregandoMunicipios(false);
      }
    }
    carregarMunicipios();
    return () => { cancelado = true; };
  }, []);

  useEffect(() => {
    if (!municipioSelecionado) return;
    let cancelado = false;
    async function carregarResultados() {
      try {
        setCarregando(true);
        setErro(null);
        setResultado(null);
        const dados = await getResultados(municipioSelecionado, anoSelecionado, turnoSelecionado);
        if (cancelado) return;
        setResultado(dados);
        setCargoSelecionado((atual) =>
          dados.offices.some((office) => office.officeCode === atual) ? atual : dados.offices[0]?.officeCode ?? null
        );
      } catch (error) {
        if (cancelado) return;
        setErro(error instanceof Error ? error.message : "Erro ao carregar resultados.");
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }
    carregarResultados();
    return () => { cancelado = true; };
  }, [municipioSelecionado, anoSelecionado, turnoSelecionado]);

  const cargo: OfficeResult | undefined = resultado?.offices.find((office) => office.officeCode === cargoSelecionado);
  const candidatosOrdenados: CandidateResult[] = cargo ? [...cargo.candidates].sort((a, b) => b.votes - a.votes) : [];

  // 👇 CORREÇÃO: Força a atualização dos IDs quando o cargo ou a lista mudar
  useEffect(() => {
    if (candidatosOrdenados.length > 0) {
      // Pega os IDs dos dois primeiros candidatos
      const primeiro = candidatosOrdenados[0]?.candidateId ?? "";
      const segundo = candidatosOrdenados[1]?.candidateId ?? "";

      // Se o candidato atual não existir na nova lista, substitui pelo primeiro
      const idAValido = candidatosOrdenados.some((c) => c.candidateId === candidatoAId);
      const idBValido = candidatosOrdenados.some((c) => c.candidateId === candidatoBId);

      if (!idAValido) setCandidatoAId(primeiro);
      if (!idBValido || (idBValido && segundo !== candidatoBId && primeiro === candidatoBId)) {
         // Se o B for igual ao A, ou não existir, define o segundo (ou o que não for o A)
         setCandidatoBId(segundo !== primeiro ? segundo : candidatosOrdenados.find(c => c.candidateId !== candidatoAId)?.candidateId ?? "");
      }
    } else {
      // Se não houver candidatos para o cargo, limpa os IDs
      setCandidatoAId("");
      setCandidatoBId("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargoSelecionado, candidatosOrdenados.length]); // Reage à troca de cargo ou de tamanho da lista

  const candidatoA = candidatosOrdenados.find((c) => String(c.candidateId) === String(candidatoAId)) || null;
  const candidatoB = candidatosOrdenados.find((c) => String(c.candidateId) === String(candidatoBId)) || null;

  function selecionarCandidatoA(id: string) {
    setCandidatoAId(id);
    if (id === candidatoBId) {
      const substituto = candidatosOrdenados.find((c) => c.candidateId !== id);
      setCandidatoBId(substituto?.candidateId ?? "");
    }
  }

  const { candidatoA: sqCandidatoA, candidatoB: sqCandidatoB, carregando: carregandoIdentificadores, erro: erroIdentificadores } = useSqCandidatosComparacao({
    candidatoA: candidatoA || undefined, 
    candidatoB: candidatoB || undefined, 
    ano: anoSelecionado, 
    turno: turnoSelecionado, 
    cargo: cargoSelecionado, 
    habilitado: abaAtiva === "geografica" && Boolean(candidatoA && candidatoB),
  });

  const { mapaA, carregando: carregandoMapas, erro: erroMapas } = useComparacaoGeografica({
    sqCandidatoA, sqCandidatoB, ano: anoSelecionado, turno: turnoSelecionado,
  });

  const { malha, erroMalha } = useMalhaMunicipal();

  const { municipioSelecionado: munMapaSelecionado, secoesMapa, carregarSecoes } = useSecoesMunicipio({
    candidato: candidatoA ? ({ ...candidatoA, sqCandidato: candidatoA.candidateId } as any) : null,
  });

  const { secaoSelecionada, painelSecoesAberto, votosSecao, carregandoVotosSecao, erroVotosSecao, selecionarSecao, fecharPainelSecoes } = useVotosSecao();

  const diferencaVotos = candidatoA && candidatoB ? Math.abs(candidatoA.votes - candidatoB.votes) : 0;
  const diferencaPercentual = candidatoA && candidatoB ? Math.abs(candidatoA.percentage - candidatoB.percentage) : 0;
  const dadosGrafico = candidatoA && candidatoB ? [candidatoA, candidatoB].map((c) => ({ nome: c.candidateName, votos: c.votes })) : [];

  const municipiosComCoordenadas = mapaA.municipios.filter((m) => m.latitude !== null && m.longitude !== null);

  // Sincroniza o select visual com o estado real (garante que o option selecionado exista)
  const selectValueA = candidatosOrdenados.some(c => c.candidateId === candidatoAId) ? candidatoAId : "";
  const selectValueB = candidatosOrdenados.some(c => c.candidateId === candidatoBId) ? candidatoBId : "";

  return (
    <section className="comparacao">
      <header className="comparacao-header">
        <span className="comparacao-etiqueta">ANÁLISE ELEITORAL</span>
        <h1>Comparação de candidatos</h1>
        <p>Compare o desempenho eleitoral de dois candidatos em diferentes perspectivas.</p>
      </header>

      <section className="comparacao-filtros">
        <div className="comparacao-campo">
          <label>Município</label>
          <select value={municipioSelecionado} onChange={(e) => setMunicipioSelecionado(e.target.value)} disabled={carregandoMunicipios}>
            {municipios.map((m) => <option key={m.tseCode} value={m.tseCode}>{m.ibgeName}</option>)}
          </select>
        </div>
        <div className="comparacao-campo">
          <label>Ano eleitoral</label>
          <input type="number" value={anoSelecionado} onChange={(e) => setAnoSelecionado(Number(e.target.value))} />
        </div>
        <div className="comparacao-campo">
          <label>Turno</label>
          <select value={turnoSelecionado} onChange={(e) => setTurnoSelecionado(Number(e.target.value))}>
            <option value={1}>1º turno</option>
            <option value={2}>2º turno</option>
          </select>
        </div>
        <div className="comparacao-campo">
          <label>Cargo eleitoral</label>
          <select 
            value={cargoSelecionado ?? ""} 
            onChange={(e) => {
              setCargoSelecionado(Number(e.target.value));
              setCandidatoAId(""); // Limpa para forçar o useEffect a buscar os novos
              setCandidatoBId("");
            }} 
            disabled={!resultado || carregando}
          >
            {resultado?.offices.map((office) => <option key={office.officeCode} value={office.officeCode}>{office.officeName}</option>)}
          </select>
        </div>
      </section>

      {carregandoMunicipios && <p className="comparacao-mensagem">Carregando municípios...</p>}
      {carregando && <p className="comparacao-mensagem">Carregando resultados eleitorais...</p>}
      {erro && <div className="comparacao-erro">{erro}</div>}

      {resultado && !carregando && cargo && (
        <>
          <section className="comparacao-selecao">
            <div className="comparacao-selecao-header">
              <div>
                <h2>Selecione os candidatos</h2>
                <p>{resultado.municipalityName} · {anoSelecionado} · {turnoSelecionado}º turno</p>
              </div>
              <span className="comparacao-cargo">{cargo.officeName}</span>
            </div>

            <div className="comparacao-candidatos">
              <div className="comparacao-campo">
                <label>Candidato A</label>
                <select value={selectValueA} onChange={(e) => selecionarCandidatoA(e.target.value)}>
                  {candidatosOrdenados.map((c) => <option key={c.candidateId} value={c.candidateId}>{c.candidateName}</option>)}
                </select>
              </div>
              <div className="comparacao-divisor">VS</div>
              <div className="comparacao-campo">
                <label>Candidato B</label>
                <select value={selectValueB} onChange={(e) => setCandidatoBId(e.target.value)}>
                  {candidatosOrdenados.filter((c) => c.candidateId !== candidatoAId).map((c) => <option key={c.candidateId} value={c.candidateId}>{c.candidateName}</option>)}
                </select>
              </div>
            </div>
          </section>

          <nav className="comparacao-abas">
            <button type="button" className={abaAtiva === "votos" ? "ativa" : ""} onClick={() => setAbaAtiva("votos")}>01 Comparação de votos</button>
            <button type="button" className={abaAtiva === "geografica" ? "ativa" : ""} onClick={() => setAbaAtiva("geografica")}>02 Comparação geográfica</button>
          </nav>

          {abaAtiva === "votos" && (
            <>
              <section className="comparacao-resultados">
                <article className="comparacao-candidato comparacao-candidato-a">
                  <div className="comparacao-candidato-topo"><span>CANDIDATO A</span><span>{candidatoA?.partyAbbreviation || "-"}</span></div>
                  <h3>{candidatoA?.candidateName || "Selecione o candidato A"}</h3>
                  <p className="comparacao-partido">{candidatoA?.partyName || "-"}</p>
                  <div className="comparacao-metricas">
                    <div><span>Votos recebidos</span><strong>{formatarNumero(candidatoA?.votes || 0)}</strong></div>
                    <div><span>Percentual</span><strong>{formatarPercentual(candidatoA?.percentage || 0)}</strong></div>
                  </div>
                </article>
                <article className="comparacao-candidato comparacao-candidato-b">
                  <div className="comparacao-candidato-topo"><span>CANDIDATO B</span><span>{candidatoB?.partyAbbreviation || "-"}</span></div>
                  <h3>{candidatoB?.candidateName || "Selecione o candidato B"}</h3>
                  <p className="comparacao-partido">{candidatoB?.partyName || "-"}</p>
                  <div className="comparacao-metricas">
                    <div><span>Votos recebidos</span><strong>{formatarNumero(candidatoB?.votes || 0)}</strong></div>
                    <div><span>Percentual</span><strong>{formatarPercentual(candidatoB?.percentage || 0)}</strong></div>
                  </div>
                </article>
              </section>
              <section className="comparacao-diferenca">
                <div><span>Diferença de votos</span><strong>{formatarNumero(diferencaVotos)}</strong></div>
                <div><span>Diferença percentual</span><strong>{formatarPercentual(diferencaPercentual)}</strong></div>
                <p>{diferencaVotos === 0 ? "Os candidatos terminaram empatados em votos." : (candidatoA?.votes || 0) > (candidatoB?.votes || 0) ? `${candidatoA?.candidateName} ficou à frente na votação.` : `${candidatoB?.candidateName} ficou à frente na votação.`}</p>
              </section>
              <section className="comparacao-grafico">
                <div className="comparacao-grafico-header"><h2>Desempenho comparativo</h2><p>Quantidade de votos por candidato</p></div>
                <div className="comparacao-grafico-visual">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosGrafico} layout="vertical" margin={{ top: 10, right: 25, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="nome" width={150} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="votos" name="Votos" radius={[0, 6, 6, 0]}>{dadosGrafico.map((item, index) => <Cell key={item.nome} fill={CORES[index]} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </>
          )}

          {abaAtiva === "geografica" && (
            <section className="comparacao-geografica">
              <header className="comparacao-geografica-header">
                <h2>Distribuição geográfica dos votos</h2>
                <p>Compare a presença eleitoral dos candidatos nos municípios do Ceará.</p>
              </header>

              {carregandoIdentificadores && <p className="comparacao-mensagem">Carregando...</p>}
              {erroIdentificadores && <div className="comparacao-erro">{erroIdentificadores}</div>}
              {!carregandoIdentificadores && !erroIdentificadores && sqCandidatoA && sqCandidatoB && carregandoMapas && <p className="comparacao-mensagem">Carregando mapas...</p>}
              {erroMapas && <div className="comparacao-erro">{erroMapas}</div>}
              {erroMalha && <div className="comparacao-erro">{erroMalha}</div>}

              {!carregandoIdentificadores && !erroIdentificadores && !carregandoMapas && !erroMapas && !erroMalha && sqCandidatoA && sqCandidatoB && malha && (
                <div 
                  style={{ 
                    display: "grid", 
                    gridTemplateColumns: painelSecoesAberto && munMapaSelecionado ? "1fr 400px" : "1fr", 
                    gap: "1rem",
                    height: "calc(100vh - 340px)",
                    minHeight: "500px",
                    overflow: "hidden"
                  }}
                >
                  <div className="mapa-container" style={{ height: "100%", width: "100%", borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0", background: "#fff" }}>
                    <MapaLeaflet
                      key={`mapa-${candidatoAId}-${candidatoBId}`}
                      candidatoId={candidatoAId}
                      malha={malha}
                      municipios={mapaA.municipios}
                      municipiosComCoordenadas={municipiosComCoordenadas}
                      secoesMapa={secoesMapa}
                      municipioSelecionado={munMapaSelecionado}
                      modo="municipios"
                      onSelecionarMunicipio={(municipio) => {
                        void carregarSecoes(municipio, 1);
                      }}
                      onSelecionarSecao={(secao) => {
                        void selecionarSecao(secao);
                      }}
                    />
                  </div>

                  {painelSecoesAberto && munMapaSelecionado && (
                    <div style={{ height: "100%", overflow: "hidden", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                      <PainelSecoes
                        municipio={munMapaSelecionado}
                        secoes={secoesMapa}
                        secaoSelecionada={secaoSelecionada}
                        votosSecao={votosSecao}
                        carregandoVotos={carregandoVotosSecao}
                        erroVotos={erroVotosSecao}
                        onFechar={fecharPainelSecoes}
                        onSelecionarSecao={(secao) => void selecionarSecao(secao)}
                      />
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </section>
  );
}