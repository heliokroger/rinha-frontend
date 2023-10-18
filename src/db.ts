import Dexie from "dexie";

const db = new Dexie("tree");

db.version(1).stores({
  chunks: `
    ++id,
    indiceRange
  `,
});

export default db;

export enum Table {
  Chunks = "chunks",
}

export async function recreate() {
  return db.delete().then(() => db.open());
}
