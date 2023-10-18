import db, { Table } from "../db";
import Logger from "../logger";

const logger = new Logger("READ JSON WORKER");

export const CHUNK_SIZE = 1_000;

self.onmessage = async (event: MessageEvent<File>) => {
  const file = event.data;

  const start = performance.now();

  const fileReader = new FileReaderSync();

  let i = 0;
  while (i <= file.size) {
    const slice = file.slice(i, i + CHUNK_SIZE);
    const chunk = fileReader.readAsText(slice);

    db.table(Table.Chunks)
      .add({ chunk })
      .then(() => logger.log("Inserted new chunk"));

    self.postMessage(chunk);

    i += CHUNK_SIZE;
  }

  // const writableStream = new WritableStream({
  //   async write(chunk) {
  //     db.table(Table.Chunks)
  //       .add({ chunk })
  //       .then(() => logger.log("Inserted new chunk"));

  //     self.postMessage(chunk);
  //   },
  // });

  // file
  //   .stream()
  //   .pipeThrough(new TextDecoderStream())
  //   .pipeTo(writableStream)
  //   .then(() => {
  const end = performance.now();

  db.table(Table.Chunks)
    .count()
    .then((count) => {
      const diff = Math.round(end - start);

      logger.log(`Inserted ${count} chunks`);
      logger.log("Done reading json");
      logger.log(`Took ${diff}ms`);

      self.postMessage(diff);
    });
  // });
};
