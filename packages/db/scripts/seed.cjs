// Seeds the school map's shared floor-plan locations: the 16 rooms + 16
// points of interest. Geometry (coordinates, nav graph) is NOT seeded here
// — it stays in application code (apps/web/lib/mapa/geometry.ts), matched to
// these rows by `code`. Idempotent: every row is upserted.
//
// Subjects, teachers, class groups, room shifts and lessons belong to the
// signed-in user and are created on demand — not seeded. Pre-ownerId rows
// from the first map release are claimed on the owner's first `mapData`
// query. Does NOT seed the HTML prototype's example data (class "5º A",
// "Prof. Ana", one lesson in Sala 07).

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const rooms = [
  { code: "13", name: "Sala 13" },
  { code: "14", name: "Sala 14" },
  { code: "15", name: "Sala 15" },
  { code: "16", name: "Sala 16" },
  { code: "01", name: "Sala 01" },
  { code: "02", name: "Sala 02" },
  { code: "03", name: "Sala 03" },
  { code: "12", name: "Sala 12" },
  { code: "11", name: "Sala 11" },
  { code: "10", name: "Sala 10" },
  { code: "09", name: "Sala 09" },
  { code: "08", name: "Sala 08" },
  { code: "07", name: "Sala 07" },
  { code: "06", name: "Sala 06" },
  { code: "05", name: "Sala 05" },
  { code: "04", name: "Sala 04" },
];

const pois = [
  { code: "entrada", name: "Entrada / Portão" },
  { code: "lobby", name: "Lobby" },
  { code: "biblioteca", name: "Biblioteca" },
  { code: "tecnologia", name: "Tecnologia" },
  { code: "bicicletario", name: "Bicicletário" },
  { code: "estacionamento", name: "Estacionamento" },
  { code: "administracao", name: "Administração Escolar" },
  { code: "coordenacao", name: "Coordenação Pedagógica" },
  { code: "direcao", name: "Direção" },
  { code: "sala_professores", name: "Sala dos Professores" },
  { code: "wc", name: "WC" },
  { code: "cantina", name: "Cantina" },
  { code: "ginasio", name: "Ginásio" },
  { code: "area_verde_1", name: "Área Verde" },
  { code: "area_verde_2", name: "Área Verde" },
  { code: "area_verde_3", name: "Área Verde" },
];

const seedLocations = async () => {
  for (const room of rooms) {
    await prisma.location.upsert({
      where: { code: room.code },
      update: { name: room.name, kind: "ROOM" },
      create: { code: room.code, name: room.name, kind: "ROOM" },
    });
  }

  for (const poi of pois) {
    await prisma.location.upsert({
      where: { code: poi.code },
      update: { name: poi.name, kind: "POI" },
      create: { code: poi.code, name: poi.name, kind: "POI" },
    });
  }
};

const main = async () => {
  await seedLocations();
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
