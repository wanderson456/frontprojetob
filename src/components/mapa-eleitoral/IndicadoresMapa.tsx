interface IndicadoresMapaProps {
  totalMunicipios: number;
  municipiosComVotos: number;
  totalVotos: number;
}

export default function IndicadoresMapa({
  totalMunicipios,
  municipiosComVotos,
  totalVotos,
}: IndicadoresMapaProps) {
  return (
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
  );
}