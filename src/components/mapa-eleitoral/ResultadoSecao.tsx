import { useMemo } from "react";
import type { SectionVoteItem } from "../../types/eleicoes";

interface ResultadoSecaoProps {
  votosSecao: SectionVoteItem[];
  carregando: boolean;
  erro: string;
  nomeCandidatoA?: string;
  nomeCandidatoB?: string;
  cargoSelecionadoId?: number | null;
  numeroCandidatoA?: string;
  numeroCandidatoB?: string;
  abaSelecionada: number | null;
  onAbaChange: (codigo: number) => void;
}

export default function ResultadoSecao({
  votosSecao,
  carregando,
  erro,
  nomeCandidatoA,
  nomeCandidatoB,
  cargoSelecionadoId,
  numeroCandidatoA,
  numeroCandidatoB,
  abaSelecionada,
  onAbaChange,
}: ResultadoSecaoProps) {
  const gruposPorCargo = useMemo(() => {
    return Array.from(
      votosSecao.reduce((grupos, voto) => {
        const grupo = grupos.get(voto.officeCode) ?? {
          officeCode: voto.officeCode,
          officeName: voto.officeName,
          items: [] as SectionVoteItem[],
        };
        grupo.items.push(voto);
        grupos.set(voto.officeCode, grupo);
        return grupos;
      }, new Map<number, { officeCode: number; officeName: string; items: SectionVoteItem[] }>())
    );
  }, [votosSecao]);

  // Define a aba ativa: se abaSelecionada existir, usa ela; senão, usa o cargo comparado ou o primeiro
  const codigoAtual = abaSelecionada ?? cargoSelecionadoId ?? gruposPorCargo[0]?.[0] ?? null;
  const grupoAtual = gruposPorCargo.find(([codigo]) => codigo === codigoAtual) || gruposPorCargo[0];
  const dadosCargo = grupoAtual?.[1];

  const isCandidatoA = (codigo: string) => numeroCandidatoA && String(codigo) === String(numeroCandidatoA);
  const isCandidatoB = (codigo: string) => numeroCandidatoB && String(codigo) === String(numeroCandidatoB);

  const todosCandidatos = (dadosCargo?.items ?? []).filter((item) => item.voteType === "NOMINAL");
  
  const candidatoAObj = todosCandidatos.find((i) => isCandidatoA(i.voteCode));
  const candidatoBObj = todosCandidatos.find((i) => isCandidatoB(i.voteCode));
  
  const faltaA = numeroCandidatoA && !candidatoAObj;
  const faltaB = numeroCandidatoB && !candidatoBObj;

  const outrosCandidatos = todosCandidatos
    .filter((i) => !isCandidatoA(i.voteCode) && !isCandidatoB(i.voteCode))
    .sort((a, b) => b.quantity - a.quantity);

  const nominais = [];
  if (candidatoAObj) nominais.push(candidatoAObj);
  if (candidatoBObj) nominais.push(candidatoBObj);
  nominais.push(...outrosCandidatos);

  const legendas = (dadosCargo?.items ?? []).filter((item) => item.voteType === "LEGENDA");
  const brancos = (dadosCargo?.items ?? []).filter((item) => item.voteType === "BRANCO").reduce((total, item) => total + item.quantity, 0);
  const nulos = (dadosCargo?.items ?? []).filter((item) => item.voteType === "NULO").reduce((total, item) => total + item.quantity, 0);

  const maiorVotacao = Math.max(...nominais.map((item) => item.quantity), 1);
  const candidatosExibidos = nominais.slice(0, 5);

  return (
    <div className="mapa-painel-resultados">
      <h3>Votação por cargo</h3>

      {carregando && <div className="mapa-mensagem">Carregando resultados da seção...</div>}
      {erro && <div className="mapa-erro">{erro}</div>}
      {!carregando && !erro && votosSecao.length === 0 && <p>Selecione uma seção para consultar os votos.</p>}

      {!carregando && !erro && gruposPorCargo.length > 0 && (
        <>
          <div className="mapa-cargos-tabs" role="tablist" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            {gruposPorCargo.map(([codigo, grupo]) => (
              <button
                key={codigo}
                type="button"
                role="tab"
                aria-selected={codigoAtual === codigo}
                className={codigoAtual === codigo ? "ativo" : ""}
                onClick={() => onAbaChange(codigo)}
                style={{
                  padding: "0.4rem 0.8rem",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: codigoAtual === codigo ? "#C92071" : "#fff",
                  color: codigoAtual === codigo ? "#fff" : "#666",
                  border: `1px solid ${codigoAtual === codigo ? "#C92071" : "#ddd"}`,
                }}
              >
                {grupo.officeName}
              </button>
            ))}
          </div>

          {dadosCargo && (
            <section className="mapa-cargo-resultado">
              <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h4 style={{ margin: 0, fontSize: "0.95rem" }}>{dadosCargo.officeName}</h4>
                <span style={{ fontSize: "0.75rem", color: "#666" }}>Código {dadosCargo.officeCode}</span>
              </header>

              {faltaA && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem", marginBottom: "0.5rem", background: "#fce7f3", borderLeft: "3px solid #C92071", borderRadius: "4px", fontSize: "0.8rem", color: "#C92071" }}>
                  <strong>{nomeCandidatoA} (A)</strong>
                  <strong>0 votos</strong>
                </div>
              )}

              {faltaB && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem", marginBottom: "0.5rem", background: "#e0e7ff", borderLeft: "3px solid #7779D9", borderRadius: "4px", fontSize: "0.8rem", color: "#7779D9" }}>
                  <strong>{nomeCandidatoB} (B)</strong>
                  <strong>0 votos</strong>
                </div>
              )}

              {candidatosExibidos.map((item, index) => {
                const destaqueA = isCandidatoA(item.voteCode);
                const destaqueB = isCandidatoB(item.voteCode);

                const corTexto = destaqueA ? "#C92071" : destaqueB ? "#7779D9" : "#222";
                const corBarra = destaqueA ? "#C92071" : destaqueB ? "#7779D9" : "#cbd5e1";

                return (
                  <div className="mapa-candidato-votos" key={item.candidateId} style={{ marginBottom: "0.75rem" }}>
                    <div className="mapa-candidato-votos-info" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#666", width: "20px" }}>{index + 1}º</span>
                        <div>
                          <strong style={{ fontSize: "0.85rem", color: corTexto }}>
                            {item.voteName}
                            {destaqueA && " (A)"}
                            {destaqueB && " (B)"}
                          </strong>
                          <small style={{ display: "block", fontSize: "0.7rem", color: "#666" }}>Número {item.voteCode}</small>
                        </div>
                      </div>
                      <strong style={{ fontSize: "0.9rem", color: corTexto }}>{item.quantity.toLocaleString("pt-BR")}</strong>
                    </div>
                    <div className="mapa-barra-fundo" style={{ height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                      <div
                        className="mapa-barra-preenchimento"
                        style={{
                          height: "100%",
                          width: `${(item.quantity / maiorVotacao) * 100}%`,
                          backgroundColor: corBarra,
                          transition: "width 0.5s ease-in-out",
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              {legendas.length > 0 && (
                <div className="mapa-votos-adicionais" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #eee" }}>
                  <strong style={{ fontSize: "0.8rem", display: "block", marginBottom: "0.5rem" }}>Votos de legenda</strong>
                  {legendas.map((item, index) => (
                    <div key={`${item.voteCode}-${index}`} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                      <span style={{ color: "#666" }}>{item.voteName}</span>
                      <strong>{item.quantity.toLocaleString("pt-BR")}</strong>
                    </div>
                  ))}
                </div>
              )}

              <div className="mapa-votos-adicionais" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                <div><span style={{ color: "#666" }}>Votos brancos</span><strong style={{ marginLeft: "0.5rem" }}>{brancos.toLocaleString("pt-BR")}</strong></div>
                <div><span style={{ color: "#666" }}>Votos nulos</span><strong style={{ marginLeft: "0.5rem" }}>{nulos.toLocaleString("pt-BR")}</strong></div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}