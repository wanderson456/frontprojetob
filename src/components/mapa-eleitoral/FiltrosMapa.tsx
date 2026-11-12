
import type { CandidateListItem } from "../../types/eleicoes";

interface CargoOption {
  codigo: number;
  nome: string;
}

interface FiltrosMapaProps {
  cargos: CargoOption[];
  cargo: number;
  busca: string;
  candidato: CandidateListItem | null;
  candidatos: CandidateListItem[];
  paginaCandidatos: number;
  totalPaginasCandidatos: number;
  carregandoCandidatos: boolean;
  onCargoChange: (cargo: number) => void;
  onBuscaChange: (busca: string) => void;
  onCandidatoChange: (sqCandidato: string) => void;
  onPaginaChange: (pagina: number) => void;
}

export default function FiltrosMapa({
  cargos,
  cargo,
  busca,
  candidato,
  candidatos,
  paginaCandidatos,
  totalPaginasCandidatos,
  carregandoCandidatos,
  onCargoChange,
  onBuscaChange,
  onCandidatoChange,
  onPaginaChange,
}: FiltrosMapaProps) {
  return (
    <section className="mapa-filtros">
      <div className="mapa-filtro">
        <label htmlFor="cargo">Cargo</label>
        <select
          id="cargo"
          value={cargo}
          onChange={(event) => onCargoChange(Number(event.target.value))}
        >
          {cargos.map((item) => (
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
          onChange={(event) => onBuscaChange(event.target.value)}
          placeholder="Nome ou número do candidato..."
        />
      </div>

      <div className="mapa-filtro">
        <label htmlFor="candidato">Candidato</label>
        <select
          id="candidato"
          value={candidato?.sqCandidato ?? ""}
          disabled={carregandoCandidatos || candidatos.length === 0}
          onChange={(event) => onCandidatoChange(event.target.value)}
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
          onClick={() => onPaginaChange(paginaCandidatos - 1)}
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
          onClick={() => onPaginaChange(paginaCandidatos + 1)}
        >
          Próxima
        </button>
      </div>
    </section>
  );
}
