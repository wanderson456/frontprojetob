
import type { SectionItem } from "../../types/eleicoes";

interface TabelaSecoesProps {
  secoes: SectionItem[];
  secaoSelecionada?: SectionItem | null;
  onSelecionarSecao: (secao: SectionItem) => void;
}

export default function TabelaSecoes({
  secoes,
  secaoSelecionada = null,
  onSelecionarSecao,
}: TabelaSecoesProps) {
  return (
    <div className="mapa-tabela-container">
      <table className="mapa-tabela">
        <thead>
          <tr>
            <th scope="col">Zona eleitoral</th>
            <th scope="col">Seção</th>
            <th scope="col">Votos</th>
            <th scope="col">Latitude</th>
            <th scope="col">Longitude</th>
          </tr>
        </thead>

        <tbody>
          {secoes.map((secao) => {
            const selecionada =
              secaoSelecionada?.zone === secao.zone &&
              secaoSelecionada?.section === secao.section;

            return (
              <tr
                key={`${secao.zone}-${secao.section}`}
                className={selecionada ? "selecionada" : ""}
                aria-selected={selecionada}
                tabIndex={0}
                onClick={() => onSelecionarSecao(secao)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelecionarSecao(secao);
                  }
                }}
              >
                <td>{secao.zone}</td>
                <td>{secao.section}</td>
                <td>
                  <strong className="mapa-tabela-votos">
                    {secao.votes.toLocaleString("pt-BR")}
                  </strong>
                </td>
                <td>{secao.latitude ?? "—"}</td>
                <td>{secao.longitude ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
