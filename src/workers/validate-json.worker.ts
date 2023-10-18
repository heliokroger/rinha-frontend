import Logger from "../logger";

declare const FileReaderSync: {
  prototype: FileReaderSync;
  new (): FileReaderSync;
};

const logger = new Logger("VALIDATE JSON WORKER");

self.onmessage = (event: MessageEvent<File>) => {
  const file = event.data;

  const start = performance.now();
  logger.log("Parsing received file");

  const json = new FileReaderSync().readAsText(file);

  try {
    JSON.parse(json);

    logger.log("Received file is valid");

    self.postMessage(true);
  } catch (err) {
    logger.log("Received file is invalid");
    self.postMessage(false);
  } finally {
    const end = performance.now();

    logger.log(`Took ${Math.round(end - start)}ms`);
  }
};
