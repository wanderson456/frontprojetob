import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { CandidateGeoMunicipality } from "../../types/eleicoes";

interface MapaComparacaoDiferencaProps {
  municipiosA: CandidateGeoMunicipality[];
  municipiosB: CandidateGeoMunicipality[];
  nomeA: string;
  nomeB: string;
  malha: any;
}

const COR_A = "#C92071";
const COR_B = "#7779D9";

export default function MapaComparacaoDiferenca({
  municipiosA,
  municipiosB,
  nomeA,
  nomeB,
  malha,
}: MapaComparacaoDiferencaProps) {
  if (!malha) return null;

  const dictA = Object.fromEntries((municipiosA || []).map((m) => [m.ibgeCode, m.votes]));
  const dictB = Object.fromEntries((municipiosB || []).map((m) => [m.ibgeCode, m.votes]));

  const getColor = (codarea: string) => {
    const votosA = dictA[codarea] || 0;
    const votosB = dictB[codarea] || 0;

    if (votosA === 0 && votosB === 0) return "#f8f9fa";
    if (votosA === votosB) return "#CED4DA";

    const margem = Math.abs(votosA - votosB) / (votosA + votosB);
    const alpha = 0.4 + margem * 0.6;

    return votosA > votosB ? `rgba(201, 32, 113, ${alpha})` : `rgba(119, 121, 217, ${alpha})`;
  };

  const styleFeature = (feature: any) => {
    // AQUI ESTAVA O ERRO: Agora busca 'codarea' igual ao seu MapaLeaflet
    const codarea = String(feature.properties.codarea);
    return { fillColor: getColor(codarea), weight: 1, opacity: 1, color: "#fff", fillOpacity: 0.9 };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const codarea = String(feature.properties.codarea);
    const nomeMunicipio = feature.properties.name || "Município";
    
    const votosA = dictA[codarea] || 0;
    const votosB = dictB[codarea] || 0;
    const vencedor = votosA > votosB ? nomeA : votosB > votosA ? nomeB : "Empate";

    layer.bindTooltip(`
      <div style="font-size: 0.85rem; line-height: 1.4;">
        <strong>${nomeMunicipio}</strong><br/>
        <span style="color: ${COR_A}">${nomeA}: ${votosA.toLocaleString("pt-BR")}</span><br/>
        <span style="color: ${COR_B}">${nomeB}: ${votosB.toLocaleString("pt-BR")}</span><br/>
        <hr style="margin: 4px 0; border: 0; border-top: 1px solid #ddd;" />
        <strong>Vencedor: ${vencedor}</strong>
      </div>
    `);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", background: "#fff", borderRadius: "8px", border: "1px solid #eaeaea", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div style={{ padding: "1rem", borderBottom: "1px solid #eee" }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Comparação Direta
        </span>
        <h3 style={{ margin: "0.25rem 0 0 0", fontSize: "1.1rem", color: "#222" }}>
          Mapa de Diferença (Quem venceu onde)
        </h3>
      </div>

      <div style={{ height: "500px", width: "100%", position: "relative" }}>
        <MapContainer center={[-5.4, -39.5]} zoom={7} style={{ height: "100%", width: "100%", background: "#f8f9fa" }} scrollWheelZoom={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <GeoJSON data={malha} style={styleFeature} onEachFeature={onEachFeature} />
        </MapContainer>
      </div>

      <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8f9fa" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
          <span style={{ width: "16px", height: "16px", borderRadius: "4px", backgroundColor: COR_A }} />
          <span>{nomeA}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
          <span style={{ width: "16px", height: "16px", borderRadius: "4px", backgroundColor: COR_B }} />
          <span>{nomeB}</span>
        </div>
      </div>
    </div>
  );
}