import { useState } from "react";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup } from "react-leaflet";
import type { Feature, Geometry } from "geojson";
import type { Layer, PathOptions } from "leaflet";
import "leaflet/dist/leaflet.css";

import type { CandidateGeoMunicipality, SectionItem } from "../../types/eleicoes";
import type { MunicipioFeature, MunicipioFeatureProperties } from "../../types/mapa";

interface MapaComparacaoUnificadoProps {
  municipiosA: CandidateGeoMunicipality[];
  municipiosB: CandidateGeoMunicipality[];
  nomeA: string;
  nomeB: string;
  malha: any;
  maiorVotacao: number;
  secoesMapa: SectionItem[];
  municipioSelecionado: CandidateGeoMunicipality | null;
  onSelecionarMunicipio: (municipio: CandidateGeoMunicipality) => void;
  onSelecionarSecao: (secao: SectionItem) => void;
}

type ModoVisualizacao = "diferenca" | "candidatoA" | "candidatoB";
const COR_A = "#C92071";
const COR_B = "#7779D9";

export default function MapaComparacaoUnificado({
  municipiosA,
  municipiosB,
  nomeA,
  nomeB,
  malha,
  maiorVotacao,
  secoesMapa,
  municipioSelecionado,
  onSelecionarMunicipio,
  onSelecionarSecao,
}: MapaComparacaoUnificadoProps) {
  const [modo, setModo] = useState<ModoVisualizacao>("diferenca");

  if (!malha) return null;

  const dictA = Object.fromEntries((municipiosA || []).map((m) => [m.ibgeCode, m.votes]));
  const dictB = Object.fromEntries((municipiosB || []).map((m) => [m.ibgeCode, m.votes]));

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "201, 32, 113";
  };
  
  const rgbA = hexToRgb(COR_A);
  const rgbB = hexToRgb(COR_B);

  function obterCor(codarea: string): string {
    const votosA = dictA[codarea] || 0;
    const votosB = dictB[codarea] || 0;

    if (modo === "diferenca") {
      if (votosA === 0 && votosB === 0) return "#f1f5f9";
      if (votosA === votosB) return "#CED4DA";
      const margem = Math.abs(votosA - votosB) / (votosA + votosB);
      const alpha = 0.4 + margem * 0.6;
      return votosA > votosB ? `rgba(${rgbA}, ${alpha})` : `rgba(${rgbB}, ${alpha})`;
    }

    if (modo === "candidatoA") {
      if (votosA === 0) return "#f1f5f9";
      const proporcao = Math.max(0.1, votosA / maiorVotacao);
      return `rgba(${rgbA}, ${0.2 + proporcao * 0.7})`;
    }

    if (votosB === 0) return "#f1f5f9";
    const proporcaoB = Math.max(0.1, votosB / maiorVotacao);
    return `rgba(${rgbB}, ${0.2 + proporcaoB * 0.7})`;
  }

  function estilizarMunicipio(feature?: Feature<Geometry, MunicipioFeatureProperties>): PathOptions {
    const codigo = feature?.properties?.codarea;
    return {
      fillColor: obterCor(String(codigo)),
      weight: 1,
      opacity: 1,
      color: "#ffffff",
      fillOpacity: 0.85,
    };
  }

  function configurarInteracao(feature: MunicipioFeature, layer: Layer) {
    const codarea = String(feature.properties.codarea);
    const nomeMunicipio = (feature.properties as any).name || "Município";
    const votosA = dictA[codarea] || 0;
    const votosB = dictB[codarea] || 0;
    
    let tooltipContent = `<strong>${nomeMunicipio}</strong><br/>`;

    if (modo === "diferenca") {
      const vencedor = votosA > votosB ? nomeA : votosB > votosA ? nomeB : "Empate";
      tooltipContent += `
        <span style="color: ${COR_A}">${nomeA}: ${votosA.toLocaleString("pt-BR")}</span><br/>
        <span style="color: ${COR_B}">${nomeB}: ${votosB.toLocaleString("pt-BR")}</span><br/>
        <hr style="margin: 4px 0; border: 0; border-top: 1px solid #ddd;" />
        <strong>Vencedor: ${vencedor}</strong>
      `;
    } else if (modo === "candidatoA") {
      tooltipContent += `<span style="color: ${COR_A}">Votos: ${votosA.toLocaleString("pt-BR")}</span>`;
    } else {
      tooltipContent += `<span style="color: ${COR_B}">Votos: ${votosB.toLocaleString("pt-BR")}</span>`;
    }

    layer.bindTooltip(`<div style="font-size: 0.85rem; line-height: 1.4;">${tooltipContent}</div>`);

    layer.on({
      click: () => {
        // AQUI É O SEGREDO DO ZOOM: pegamos as coordenadas do centro do polígono
        let lat = null;
        let lng = null;
        
        if (feature.geometry) {
          if (feature.geometry.type === "Polygon") {
            const coords = feature.geometry.coordinates[0] as number[][];
            // Pega o centro aproximado (primeiro ponto)
            lng = coords[0][0];
            lat = coords[0][1];
          } else if (feature.geometry.type === "MultiPolygon") {
            const coords = feature.geometry.coordinates[0][0] as number[][];
            lng = coords[0][0];
            lat = coords[0][1];
          }
        }

        const munSelecionado: CandidateGeoMunicipality = {
          ibgeCode: codarea,
          municipality: nomeMunicipio,
          votes: modo === "candidatoB" ? votosB : votosA,
          latitude: lat,
          longitude: lng,
        };
        onSelecionarMunicipio(munSelecionado);
      },
      mouseover: (event) => {
        event.target.setStyle({ weight: 2, color: "#991956", fillOpacity: 1 });
      },
      mouseout: (event) => {
        event.target.setStyle(estilizarMunicipio(feature));
      },
    });
  }

  const locaisVotacao = Array.from(
    (secoesMapa || []).reduce((locais, secao) => {
      if (secao.latitude === null || secao.longitude === null) return locais;
      const chave = secao.pollingPlaceNumber !== null ? `local-${secao.pollingPlaceNumber}` : `coord-${secao.latitude}-${secao.longitude}`;
      const local = locais.get(chave) ?? {
        pollingPlaceNumber: secao.pollingPlaceNumber,
        pollingPlaceName: secao.pollingPlaceName,
        pollingPlaceAddress: secao.pollingPlaceAddress,
        latitude: secao.latitude,
        longitude: secao.longitude,
        secoes: [] as SectionItem[],
      };
      local.secoes.push(secao);
      locais.set(chave, local);
      return locais;
    }, new Map<string, any>()).values()
  );

  // SE O MUNICÍPIO ESTIVER SELECIONADO, O MAPA VOA PARA ELE
  const centroMapa: [number, number] = 
    municipioSelecionado && municipioSelecionado.latitude != null && municipioSelecionado.longitude != null
      ? [municipioSelecionado.latitude, municipioSelecionado.longitude]
      : [-5.4, -39.5];

  const zoomMapa = municipioSelecionado && municipioSelecionado.latitude != null ? 12 : 7;

  const renderTitulo = () => {
    if (modo === "diferenca") return "Mapa de Diferença (Quem venceu onde)";
    if (modo === "candidatoA") return `Desempenho Geográfico — ${nomeA}`;
    return `Desempenho Geográfico — ${nomeB}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", background: "#fff", borderRadius: "8px", border: "1px solid #eaeaea", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      
      <div style={{ padding: "1rem", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Comparação Geográfica</span>
          <h3 style={{ margin: "0.25rem 0 0 0", fontSize: "1.1rem", color: "#222" }}>{renderTitulo()}</h3>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", background: "#f8f9fa", padding: "0.25rem", borderRadius: "6px", border: "1px solid #eaeaea" }}>
          <button onClick={() => setModo("diferenca")} style={{ padding: "0.5rem 1rem", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: 500, fontSize: "0.85rem", backgroundColor: modo === "diferenca" ? "#222" : "transparent", color: modo === "diferenca" ? "#fff" : "#666" }}>Diferença</button>
          <button onClick={() => setModo("candidatoA")} style={{ padding: "0.5rem 1rem", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: 500, fontSize: "0.85rem", backgroundColor: modo === "candidatoA" ? COR_A : "transparent", color: modo === "candidatoA" ? "#fff" : "#666" }}>{nomeA.split(" ")[0]}</button>
          <button onClick={() => setModo("candidatoB")} style={{ padding: "0.5rem 1rem", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: 500, fontSize: "0.85rem", backgroundColor: modo === "candidatoB" ? COR_B : "transparent", color: modo === "candidatoB" ? "#fff" : "#666" }}>{nomeB.split(" ")[0]}</button>
        </div>
      </div>

      <div style={{ height: "550px", width: "100%", position: "relative" }}>
        <MapContainer 
          // A KEY muda quando o município ou o modo muda, forçando o mapa a recriar e ir para o lugar certo
          key={`${modo}-${municipioSelecionado?.ibgeCode ?? "ceara"}`}
          center={centroMapa} 
          zoom={zoomMapa}
          minZoom={6}
          scrollWheelZoom
          style={{ height: "100%", width: "100%", background: "#f8f9fa" }} 
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          <GeoJSON 
            key={`${modo}`}
            data={malha} 
            style={estilizarMunicipio} 
            onEachFeature={configurarInteracao} 
          />

          {/* 👇 AQUI ESTAVA O ERRO: Adicionei o index para a chave ser única 👇 */}
          {municipioSelecionado && locaisVotacao.map((local, index) => (
            <CircleMarker
              key={`local-${local.pollingPlaceNumber ?? 'x'}-${index}-${local.latitude}-${local.longitude}`}
              center={[local.latitude, local.longitude]}
              radius={8 + Math.min(local.secoes.length, 12)}
              pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#991956", fillOpacity: 0.9 }}
            >
              <Popup autoPan autoPanPadding={[40, 40]}>
                <div className="mapa-popup mapa-popup-local">
                  <strong>{local.pollingPlaceName ?? "Local não identificado"}</strong>
                  {local.pollingPlaceNumber !== null && <span>Local de votação: {local.pollingPlaceNumber}</span>}
                  {local.pollingPlaceAddress && <small>{local.pollingPlaceAddress}</small>}
                  <span>{local.secoes.length} seção(ões) neste local</span>

                  <div className="mapa-popup-secoes">
                    {local.secoes.map((secao: any, secaoIndex: number) => (
                      <button
                        // 👇 AQUI TAMBÉM: Adicionei o secaoIndex na chave para evitar duplicatas 👇
                        key={`secao-${secao.zone}-${secao.section}-${secaoIndex}`}
                        type="button"
                        className="mapa-popup-secao"
                        onClick={() => onSelecionarSecao(secao)}
                      >
                        <strong>Zona {secao.zone} · Seção {secao.section}</strong>
                        <span>{secao.votes.toLocaleString("pt-BR")} votos</span>
                      </button>
                    ))}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      
      <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8f9fa" }}>
        {modo === "diferenca" ? (
          <><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}><span style={{ width: "16px", height: "16px", borderRadius: "4px", backgroundColor: COR_A }} /><span>{nomeA}</span></div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}><span style={{ width: "16px", height: "16px", borderRadius: "4px", backgroundColor: COR_B }} /><span>{nomeB}</span></div></>
        ) : (
          <><span style={{ fontSize: "0.75rem", color: "#666" }}>Menor votação</span><div style={{ display: "flex", gap: "2px" }}>{[0.2, 0.4, 0.6, 0.8, 1.0].map((alpha, i) => <span key={i} style={{ width: "20px", height: "10px", borderRadius: "2px", backgroundColor: `rgba(${modo === "candidatoA" ? rgbA : rgbB}, ${alpha})` }} />)}</div><span style={{ fontSize: "0.75rem", color: "#666" }}>Maior votação</span></>
        )}
      </div>
    </div>
  );
}