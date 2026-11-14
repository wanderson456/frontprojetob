import {
    MapContainer,
    TileLayer,
    CircleMarker,
    Popup,
    GeoJSON,
} from "react-leaflet";
import type { Feature, Geometry } from "geojson";
import type { Layer, PathOptions } from "leaflet";

import type {
    MalhaMunicipal,
    ModoVisualizacao,
    MunicipioFeature,
    MunicipioFeatureProperties,
} from "../../types/mapa";

import type { CandidateGeoMunicipality, SectionItem } from "../../types/eleicoes";

interface LocalVotacao {
    pollingPlaceNumber: number | null;
    pollingPlaceName: string | null;
    pollingPlaceAddress: string | null;
    latitude: number;
    longitude: number;
    secoes: SectionItem[];
}

interface MapaLeafletProps {
    candidatoId: string;
    malha: MalhaMunicipal;
    municipios: CandidateGeoMunicipality[];
    municipiosComCoordenadas: CandidateGeoMunicipality[];
    secoesMapa: SectionItem[];
    municipioSelecionado: CandidateGeoMunicipality | null;
    modo: ModoVisualizacao;
    onSelecionarMunicipio: (municipio: CandidateGeoMunicipality) => void;
    onSelecionarSecao: (secao: SectionItem) => void;
    anoSelecionado: number;
    turnoSelecionado: number;
    codigoTseMunicipio: string;
}

function PopupLocal({ local, onSelecionarSecao }: {
    local: LocalVotacao;
    onSelecionarSecao: (s: SectionItem) => void;
}) {
    return (
        <div className="mapa-popup mapa-popup-local">
            <strong>{local.pollingPlaceName ?? "Local não identificado"}</strong>
            {local.pollingPlaceNumber !== null && <span>Local: {local.pollingPlaceNumber}</span>}
            {local.pollingPlaceAddress && <small>{local.pollingPlaceAddress}</small>}

            <span>{local.secoes.length} seção(ões) neste local</span>
            <div className="mapa-popup-secoes">
                {local.secoes.map((secao) => (
                    <button
                        key={`${secao.zone}-${secao.section}`}
                        type="button"
                        className="mapa-popup-secao"
                        onClick={() => onSelecionarSecao(secao)}
                    >
                        {/* 👇 APENAS A ZONA E A SEÇÃO, SEM OS VOTOS */}
                        <strong>Zona {secao.zone} · Seção {secao.section}</strong>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function MapaLeaflet({
    candidatoId,
    malha,
    municipios,
    municipiosComCoordenadas,
    secoesMapa,
    municipioSelecionado,
    modo,
    onSelecionarMunicipio,
    onSelecionarSecao,
    anoSelecionado: _anoSelecionado,
    turnoSelecionado: _turnoSelecionado,
    codigoTseMunicipio: _codigoTseMunicipio,
}: MapaLeafletProps) {
    const votosPorMunicipio = new Map(municipios.map((m) => [m.ibgeCode, m]));
    const maiorVotacao = Math.max(...municipios.map((m) => m.votes), 1);

    function calcularRaio(votos: number) {
        return 5 + Math.sqrt(votos / maiorVotacao) * 17;
    }

    function obterCor(votos: number): string {
        if (votos === 0) return "#f1f5f9";
        const proporcao = votos / maiorVotacao;
        if (proporcao >= 0.6) return "#7a123f";
        if (proporcao >= 0.3) return "#991956";
        if (proporcao >= 0.1) return "#C92071";
        if (proporcao >= 0.03) return "#e879a8";
        return "#f3b5ce";
    }

    function estilizarMunicipio(feature?: Feature<Geometry, MunicipioFeatureProperties>): PathOptions {
        const codigo = feature?.properties?.codarea;
        const municipio = codigo ? votosPorMunicipio.get(String(codigo)) : undefined;
        return {
            fillColor: obterCor(municipio?.votes ?? 0),
            weight: 1,
            opacity: 1,
            color: "#ffffff",
            fillOpacity: 0.85,
        };
    }

    function configurarInteracao(feature: MunicipioFeature, layer: Layer) {
        const municipio = votosPorMunicipio.get(String(feature.properties.codarea));
        if (!municipio) return;

        layer.bindPopup(`
      <div class="mapa-popup">
        <strong>${municipio.municipality}</strong>
        <span>Votos: ${municipio.votes.toLocaleString("pt-BR")}</span>
        <small>Código IBGE: ${municipio.ibgeCode}</small>
      </div>
    `);

        layer.on({
            click: () => onSelecionarMunicipio(municipio),
            mouseover: (event) => {
                event.target.setStyle({ weight: 2, color: "#991956", fillOpacity: 1 });
            },
            mouseout: (event) => {
                event.target.setStyle(estilizarMunicipio(feature));
            },
        });
    }

    const locaisVotacao = Array.from(
        secoesMapa.reduce(
            (locais, secao) => {
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
            },
            new Map<string, LocalVotacao>(),
        ).values(),
    );

    const centroMapa: [number, number] =
        municipioSelecionado && municipioSelecionado.latitude !== null && municipioSelecionado.longitude !== null
            ? [municipioSelecionado.latitude, municipioSelecionado.longitude]
            : [-5.2, -39.5];

    return (
        <MapContainer
            key={`${candidatoId}-${municipioSelecionado?.ibgeCode ?? "ceara"}`}
            center={centroMapa}
            zoom={municipioSelecionado ? 12 : 7}
            minZoom={6}
            scrollWheelZoom
            className="mapa-leaflet"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {modo === "municipios" && (
                <GeoJSON
                    key={`${candidatoId}-${modo}`}
                    data={malha}
                    style={estilizarMunicipio}
                    onEachFeature={configurarInteracao}
                />
            )}

            {modo === "circulos" &&
                municipiosComCoordenadas.map((municipio) => (
                    <CircleMarker
                        key={municipio.ibgeCode}
                        center={[municipio.latitude!, municipio.longitude!]}
                        radius={calcularRaio(municipio.votes)}
                        eventHandlers={{ click: () => onSelecionarMunicipio(municipio) }}
                        pathOptions={{ color: "#991956", fillColor: "#C92071", fillOpacity: 0.65, weight: 1 }}
                    >
                        <Popup autoPan autoPanPadding={[40, 40]}>
                            <div className="mapa-popup">
                                <strong>{municipio.municipality}</strong>
                                <span>Votos: {municipio.votes.toLocaleString("pt-BR")}</span>
                                <small>Código IBGE: {municipio.ibgeCode}</small>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}

            {municipioSelecionado &&
                locaisVotacao.map((local, index) => (
                    <CircleMarker
                        key={`local-${local.pollingPlaceNumber ?? 'x'}-${index}-${local.latitude}-${local.longitude}`}
                        center={[local.latitude, local.longitude]}
                        radius={8 + Math.min(local.secoes.length, 12)}
                        pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#991956", fillOpacity: 0.9 }}
                    >
                        <Popup>
                            <PopupLocal
                                local={local}
                                onSelecionarSecao={onSelecionarSecao}
                            />
                        </Popup>
                    </CircleMarker>
                ))}
        </MapContainer>
    );
}