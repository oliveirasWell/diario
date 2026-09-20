// Static geometry for the school map, extracted verbatim from
// docs/mapa/index.html. Per docs/mapa/SPEC.md ("Static assets"), room/POI
// coordinates and the navigation graph are app configuration, not database
// rows — matched to Location.code at runtime. Do not derive these from the
// database.
import type {
  LocationGeometry,
  LocationKindCode,
  NavEdge,
  NavNodeId,
  NavNodes,
  PlacedLocation,
} from "./types";
import { DECORATIVE_POI_CODES } from "./constants";

export const IMG_W = 1155;
export const IMG_H = 1362;

export const rooms: LocationGeometry[] = [
  { code: "13", name: "Sala 13", x: 0.026, y: 0.2643, width: 0.0909, height: 0.094 },
  { code: "14", name: "Sala 14", x: 0.1169, y: 0.2643, width: 0.0606, height: 0.094 },
  { code: "15", name: "Sala 15", x: 0.1775, y: 0.2643, width: 0.0649, height: 0.094 },
  { code: "16", name: "Sala 16", x: 0.2424, y: 0.2643, width: 0.0606, height: 0.094 },
  { code: "01", name: "Sala 01", x: 0.7706, y: 0.2658, width: 0.0606, height: 0.0925 },
  { code: "02", name: "Sala 02", x: 0.8312, y: 0.2658, width: 0.0606, height: 0.0925 },
  { code: "03", name: "Sala 03", x: 0.8918, y: 0.2658, width: 0.0623, height: 0.0925 },
  { code: "12", name: "Sala 12", x: 0.026, y: 0.5154, width: 0.0909, height: 0.0903 },
  { code: "11", name: "Sala 11", x: 0.1169, y: 0.5154, width: 0.0606, height: 0.0903 },
  { code: "10", name: "Sala 10", x: 0.1775, y: 0.5154, width: 0.0649, height: 0.0903 },
  { code: "09", name: "Sala 09", x: 0.555, y: 0.5492, width: 0.0658, height: 0.0954 },
  { code: "08", name: "Sala 08", x: 0.6208, y: 0.5492, width: 0.0641, height: 0.0954 },
  { code: "07", name: "Sala 07", x: 0.6848, y: 0.5492, width: 0.0667, height: 0.0954 },
  { code: "06", name: "Sala 06", x: 0.7515, y: 0.5492, width: 0.0675, height: 0.0954 },
  { code: "05", name: "Sala 05", x: 0.819, y: 0.5492, width: 0.0658, height: 0.0954 },
  { code: "04", name: "Sala 04", x: 0.8848, y: 0.5492, width: 0.0675, height: 0.0954 },
];

export const pois: LocationGeometry[] = [
  {
    code: "entrada",
    name: "Entrada / Portão",
    x: 0.4329,
    y: 0.0073,
    width: 0.1039,
    height: 0.0624,
  },
  { code: "lobby", name: "Lobby", x: 0.4459, y: 0.0698, width: 0.1082, height: 0.6645 },
  { code: "biblioteca", name: "Biblioteca", x: 0.5368, y: 0.0734, width: 0.1299, height: 0.1468 },
  { code: "tecnologia", name: "Tecnologia", x: 0.6667, y: 0.0734, width: 0.1126, height: 0.1468 },
  {
    code: "bicicletario",
    name: "Bicicletário",
    x: 0.7792,
    y: 0.0624,
    width: 0.1905,
    height: 0.1799,
  },
  {
    code: "estacionamento",
    name: "Estacionamento",
    x: 0.026,
    y: 0.0661,
    width: 0.4026,
    height: 0.1689,
  },
  {
    code: "administracao",
    name: "Administração Escolar",
    x: 0.303,
    y: 0.2643,
    width: 0.0866,
    height: 0.094,
  },
  {
    code: "coordenacao",
    name: "Coordenação Pedagógica",
    x: 0.6017,
    y: 0.2658,
    width: 0.0866,
    height: 0.0925,
  },
  { code: "direcao", name: "Direção", x: 0.6883, y: 0.2658, width: 0.0823, height: 0.0925 },
  {
    code: "sala_professores",
    name: "Sala dos Professores",
    x: 0.2424,
    y: 0.5154,
    width: 0.1169,
    height: 0.0903,
  },
  { code: "wc", name: "WC", x: 0.5714, y: 0.4038, width: 0.0866, height: 0.0881 },
  { code: "cantina", name: "Cantina", x: 0.3134, y: 0.6461, width: 0.1325, height: 0.0866 },
  { code: "ginasio", name: "Ginásio", x: 0.0762, y: 0.7305, width: 0.3697, height: 0.1468 },
  { code: "area_verde_1", name: "Área Verde", x: 0.0346, y: 0.4082, width: 0.4113, height: 0.0617 },
  { code: "area_verde_2", name: "Área Verde", x: 0.658, y: 0.3965, width: 0.3117, height: 0.0954 },
  { code: "area_verde_3", name: "Área Verde", x: 0.4589, y: 0.7232, width: 0.5108, height: 0.1762 },
];

export const navNodes: NavNodes = {
  spine_entrance: [568, 90],
  spine_top: [568, 220],
  spine_row1: [568, 500],
  spine_mid: [568, 610],
  spine_row3: [568, 715],
  spine_bottom: [568, 940],
  lobby_south: [568, 1013],
  walk_west: [528, 1013],
  walk_gym: [528, 1100],

  room_13: [80, 500],
  room_14: [170, 500],
  room_15: [243, 500],
  room_16: [315, 500],
  poi_administracao: [400, 500],
  poi_coordenacao: [745, 500],
  poi_direcao: [842, 500],
  room_01: [925, 500],
  room_02: [995, 500],
  room_03: [1065, 500],

  room_12: [80, 715],
  room_11: [170, 715],
  room_10: [243, 715],
  poi_sala_professores: [340, 715],
  room_09: [680, 715],
  room_08: [753, 715],
  room_07: [830, 715],
  room_06: [907, 715],
  room_05: [984, 715],
  room_04: [1061, 715],

  poi_entrada: [568, 60],
  poi_biblioteca: [695, 220],
  poi_tecnologia: [835, 220],
  poi_bicicletario: [975, 220],
  poi_estacionamento: [260, 220],
  poi_wc: [705, 610],
  poi_cantina: [470, 940],
  poi_ginasio: [500, 1100],
  poi_area_verde_1: [260, 610],
  poi_area_verde_2: [810, 610],
  poi_area_verde_3: [700, 1060],
};

/** The nav graph node representing a room/POI, e.g. "room_07"/"poi_wc". */
export const navNodeIdForLocation = (locationCode: string, kind: LocationKindCode): NavNodeId =>
  kind === "ROOM" ? `room_${locationCode}` : `poi_${locationCode}`;

export const navEdges: NavEdge[] = [
  ["spine_entrance", "spine_top"],
  ["spine_top", "spine_row1"],
  ["spine_row1", "spine_mid"],
  ["spine_mid", "spine_row3"],
  ["spine_row3", "spine_bottom"],

  ["spine_top", "poi_biblioteca"],
  ["spine_top", "poi_tecnologia"],
  ["spine_top", "poi_bicicletario"],
  ["spine_top", "poi_estacionamento"],
  ["poi_entrada", "spine_entrance"],

  ["spine_row1", "room_13"],
  ["room_13", "room_14"],
  ["room_14", "room_15"],
  ["room_15", "room_16"],
  ["room_16", "poi_administracao"],
  ["poi_administracao", "spine_row1"],

  ["spine_row1", "poi_coordenacao"],
  ["poi_coordenacao", "poi_direcao"],
  ["poi_direcao", "room_01"],
  ["room_01", "room_02"],
  ["room_02", "room_03"],

  ["spine_mid", "poi_wc"],
  ["spine_mid", "poi_area_verde_1"],
  ["spine_mid", "poi_area_verde_2"],

  ["spine_row3", "room_12"],
  ["room_12", "room_11"],
  ["room_11", "room_10"],
  ["room_10", "poi_sala_professores"],
  ["poi_sala_professores", "spine_row3"],

  ["spine_row3", "room_09"],
  ["room_09", "room_08"],
  ["room_08", "room_07"],
  ["room_07", "room_06"],
  ["room_06", "room_05"],
  ["room_05", "room_04"],

  ["spine_bottom", "poi_cantina"],
  ["spine_bottom", "lobby_south"],
  ["lobby_south", "walk_west"],
  ["walk_west", "walk_gym"],
  ["walk_gym", "poi_ginasio"],
  ["lobby_south", "poi_area_verde_3"],
];

export const allLocations: PlacedLocation[] = [
  ...rooms.map((room) => ({ ...room, kind: "ROOM" as const })),
  ...pois.map((poi) => ({ ...poi, kind: "POI" as const })),
];

export const findPlacedLocation = (code: string): PlacedLocation | undefined =>
  allLocations.find((location) => location.code === code);

export const isDecorativePoi = (code: string): boolean =>
  (DECORATIVE_POI_CODES as readonly string[]).includes(code);

export const isRoutableLocation = (location: PlacedLocation): boolean => {
  if (isDecorativePoi(location.code)) {
    return false;
  }
  return navNodeIdForLocation(location.code, location.kind) in navNodes;
};

export const routableLocations = (): PlacedLocation[] => allLocations.filter(isRoutableLocation);

export type PixelRect = { x: number; y: number; width: number; height: number };

/** Converts a location's normalized (0-1) geometry to pixel coordinates in the floor plan's native size. */
export const toPixelRect = (geometry: LocationGeometry): PixelRect => ({
  x: geometry.x * IMG_W,
  y: geometry.y * IMG_H,
  width: geometry.width * IMG_W,
  height: geometry.height * IMG_H,
});

/** The pixel center of a location's rect — used to anchor route markers and labels. */
export const toPixelCenter = (geometry: LocationGeometry): [number, number] => {
  const rect = toPixelRect(geometry);
  return [rect.x + rect.width / 2, rect.y + rect.height / 2];
};
