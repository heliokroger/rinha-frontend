import Logger from "../logger";

const logger = new Logger("VALIDATE JSON WORKER");

self.onmessage = (event: MessageEvent<File>) => {
  const start = performance.now();
  self.postMessage(validateJson(event.data));

  const end = performance.now();
  logger.log(`Took ${Math.round(end - start)}ms`);
};
