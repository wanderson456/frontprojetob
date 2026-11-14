import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { CandidateGeoMunicipality } from "../../types/eleicoes";


interface MapaComparacaoCandidatoProps {
  nome: string;
  partido: string;
  municipios: CandidateGeoMunicipality[];
  malha: any;
  maiorVotacao: number;
  totalVotos: number;
  cor: string;
}

export default function MapaComparacaoCandidato({
  nome,
  partido,
  municipios,
  malha,
  maiorVotacao,
  totalVotos,
  cor,
}: MapaComparacaoCandidatoProps) {
  if (!malha || !municipios) return null;

  const dictVotos = Object.fromEntries(municipios.map((m) => [m.ibgeCode, m.votes]));

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "201, 32, 113";
  };
  const rgbBase = hexToRgb(cor);

  const getColor = (codarea: string) => {
    const votos = dictVotos[codarea] || 0;
    if (votos === 0) return "#f1f5f9"; // Cor de fundo igual ao seu mapa eleitoral
    const proporcao = Math.max(0.1, votos / maiorVotacao);
    const alpha = 0.2 + proporcao * 0.7;
    return `rgba(${rgbBase}, ${alpha})`;
  };

  const styleFeature = (feature: any) => {
    // AQUI ESTAVA O ERRO: Busca codarea
    const codarea = String(feature.properties.codarea);
    return { fillColor: getColor(codarea), weight: 1, opacity: 1, color: "#fff", fillOpacity: 0.85 };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const codarea = String(feature.properties.codarea);
    const nomeMunicipio = feature.properties.name || "Município";
    const votos = dictVotos[codarea] || 0;
    
    layer.bindTooltip(`
      <div style="font-size: 0.85rem; line-height: 1.4;">
        <strong>${nomeMunicipio}</strong><br/>
        <span style="color: ${cor}">Votos: ${votos.toLocaleString("pt-BR")}</span>
      </div>
    `);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", background: "#fff", borderRadius: "8px", border: "1px solid #eaeaea", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #eee" }}>
        <div>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: cor, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Desempenho Geográfico
          </span>
          <h3 style={{ margin: "0.25rem 0 0 0", fontSize: "1.1rem", color: "#222" }}>{nome}</h3>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>{partido}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <strong style={{ fontSize: "1.2rem", color: "#222" }}>{totalVotos.toLocaleString("pt-BR")}</strong>
          <span style={{ fontSize: "0.75rem", color: "#666", display: "block" }}>votos</span>
        </div>
      </div>

      <div style={{ height: "350px", width: "100%", position: "relative" }}>
        <MapContainer center={[-5.4, -39.5]} zoom={7} style={{ height: "100%", width: "100%", background: "#f8f9fa" }} scrollWheelZoom={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <GeoJSON data={malha} style={styleFeature} onEachFeature={onEachFeature} />
        </MapContainer>
      </div>

      <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8f9fa" }}>
        <span style={{ fontSize: "0.75rem", color: "#666" }}>Menor votação</span>
        <div style={{ display: "flex", gap: "2px" }}>
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((alpha, i) => (
            <span key={i} style={{ width: "20px", height: "10px", borderRadius: "2px", backgroundColor: `rgba(${rgbBase}, ${alpha})` }} />
          ))}
        </div>
        <span style={{ fontSize: "0.75rem", color: "#666" }}>Maior votação</span>
      </div>
    </div>
  );
}