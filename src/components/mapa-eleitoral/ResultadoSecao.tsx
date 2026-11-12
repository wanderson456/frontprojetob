
import { useState } from "react";

import type { SectionVoteItem } from "../../types/eleicoes";

interface ResultadoSecaoProps {
  votosSecao: SectionVoteItem[];
  carregando: boolean;
  erro: string;
}

export default function ResultadoSecao({
  votosSecao,
  carregando,
  erro,
}: ResultadoSecaoProps) {
  const [cargoSelecionado, setCargoSelecionado] = useState<number | null>(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const gruposPorCargo = Array.from(
    votosSecao.reduce((grupos, voto) => {
      const grupo = grupos.get(voto.officeCode) ?? {
        officeCode: voto.officeCode,
        officeName: voto.officeName,
        items: [] as SectionVoteItem[],
      };

      grupo.items.push(voto);
      grupos.set(voto.officeCode, grupo);

      return grupos;
    }, new Map<number, {
      officeCode: number;
      officeName: string;
      items: SectionVoteItem[];
    }>()),
  ).sort((a, b) => a[0] - b[0]);

  const grupoAtual =
    gruposPorCargo.find(([codigo]) => codigo === cargoSelecionado) ??
    gruposPorCargo[0];

  const codigoAtual = grupoAtual?.[0];
  const dadosCargo = grupoAtual?.[1];

  const nominais = (dadosCargo?.items ?? [])
    .filter((item) => item.voteType === "NOMINAL")
    .sort((a, b) => b.quantity - a.quantity);

  const legendas = (dadosCargo?.items ?? []).filter(
    (item) => item.voteType === "LEGENDA",
  );

  const brancos = (dadosCargo?.items ?? [])
    .filter((item) => item.voteType === "BRANCO")
    .reduce((total, item) => total + item.quantity, 0);

  const nulos = (dadosCargo?.items ?? [])
    .filter((item) => item.voteType === "NULO")
    .reduce((total, item) => total + item.quantity, 0);

  const maiorVotacao = Math.max(
    ...nominais.map((item) => item.quantity),
    1,
  );

  const candidatosExibidos = mostrarTodos
    ? nominais
    : nominais.slice(0, 3);

  return (
    <div className="mapa-painel-resultados">
      <h3>Votação por cargo</h3>

      {carregando && (
        <div className="mapa-mensagem">
          Carregando resultados da seção...
        </div>
      )}

      {erro && (
        <div className="mapa-erro">
          {erro}
        </div>
      )}

      {!carregando && !erro && votosSecao.length === 0 && (
        <p>Selecione uma seção para consultar os votos.</p>
      )}

      {!carregando && !erro && gruposPorCargo.length > 0 && (
        <>
          <div className="mapa-cargos-tabs" role="tablist">
            {gruposPorCargo.map(([codigo, grupo]) => (
              <button
                key={codigo}
                type="button"
                role="tab"
                aria-selected={codigoAtual === codigo}
                className={codigoAtual === codigo ? "ativo" : ""}
                onClick={() => {
                  setCargoSelecionado(codigo);
                  setMostrarTodos(false);
                }}
              >
                {grupo.officeName}
              </button>
            ))}
          </div>

          {dadosCargo && (
            <section className="mapa-cargo-resultado">
              <header>
                <h4>{dadosCargo.officeName}</h4>
                <span>Código {dadosCargo.officeCode}</span>
              </header>

              {candidatosExibidos.map((item, index) => (
                <div
                  className="mapa-candidato-votos"
                  key={item.candidateId}
                >
                  <div className="mapa-candidato-votos-info">
                    <span className="mapa-posicao">
                      {index + 1}º
                    </span>

                    <div>
                      <strong>{item.voteName}</strong>
                      <small>Número {item.voteCode}</small>
                    </div>

                    <strong className="mapa-quantidade-votos">
                      {item.quantity.toLocaleString("pt-BR")}
                    </strong>
                  </div>

                  <div className="mapa-barra-fundo">
                    <div
                      className="mapa-barra-preenchimento"
                      style={{
                        width: `${(item.quantity / maiorVotacao) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}

              {nominais.length > 3 && (
                <button
                  type="button"
                  className="mapa-ver-todos"
                  onClick={() => setMostrarTodos((atual) => !atual)}
                >
                  {mostrarTodos
                    ? "Mostrar menos"
                    : `Ver todos os ${nominais.length} candidatos`}
                </button>
              )}

              {legendas.length > 0 && (
                <div className="mapa-votos-adicionais">
                  <strong>Votos de legenda</strong>

                  {legendas.map((item, index) => (
                    <div key={`${item.voteCode}-${index}`}>
                      <span>{item.voteName}</span>
                      <strong>
                        {item.quantity.toLocaleString("pt-BR")}
                      </strong>
                    </div>
                  ))}
                </div>
              )}

              <div className="mapa-votos-adicionais">
                <div>
                  <span>Votos brancos</span>
                  <strong>{brancos.toLocaleString("pt-BR")}</strong>
                </div>

                <div>
                  <span>Votos nulos</span>
                  <strong>{nulos.toLocaleString("pt-BR")}</strong>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
