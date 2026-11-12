
import type {
  Feature,
  FeatureCollection,
  Geometry,
} from "geojson";

export interface MunicipioFeatureProperties {
  codarea: string;
}

export type MunicipioFeature = Feature<
  Geometry,
  MunicipioFeatureProperties
>;

export type MalhaMunicipal = FeatureCollection<
  Geometry,
  MunicipioFeatureProperties
>;

export type ModoVisualizacao = "circulos" | "municipios";
