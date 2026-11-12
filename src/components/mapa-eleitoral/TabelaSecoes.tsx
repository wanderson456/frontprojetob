
import type { SectionItem } from "../../types/eleicoes";

interface TabelaSecoesProps {
  secoes: SectionItem[];
}

export default function TabelaSecoes({
  secoes,
}: TabelaSecoesProps) {
  return (
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
  );
}
