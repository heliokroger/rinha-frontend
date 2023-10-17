import db, { Table } from "../db";
import Logger from "./logger";

const logger = new Logger("READ JSON WORKER");

self.onmessage = async (event: MessageEvent<File>) => {
  const file = event.data;

  const start = performance.now();

  const writableStream = new WritableStream({
    async write(chunk) {
      await db.table(Table.Chunks).add({ chunk });
      logger.log("Inserted new chunk");

      self.postMessage(null);
    },
  });

  file
    .stream()
    .pipeThrough(new TextDecoderStream())
    .pipeTo(writableStream)
    .then(() => {
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
    });
};
