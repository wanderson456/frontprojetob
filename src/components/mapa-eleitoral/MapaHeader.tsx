interface MapaHeaderProps {
  ano: number;
  nomeCandidato: string | null;
}

export default function MapaHeader({
  ano,
  nomeCandidato,
}: MapaHeaderProps) {
  return (
    <header className="mapa-header">
      <div>
        <span className="mapa-subtitulo">DISTRIBUIÇÃO GEOGRÁFICA</span>
        <h1>Mapa Eleitoral do Ceará</h1>
        <p>
          {nomeCandidato
            ? `Distribuição dos votos de ${nomeCandidato} nas eleições de ${ano}.`
            : "Selecione um candidato para visualizar sua votação."}
        </p>
      </div>

      <div className="mapa-periodo">
        <strong>{ano}</strong>
        <span>1º turno</span>
      </div>
    </header>
  );
}