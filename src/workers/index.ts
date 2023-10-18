export const workerUrl = {
  readJsonWorker: new URL("./read-json.worker.ts", import.meta.url),
  parseJsonWorker: new URL("./parse-json.worker.ts", import.meta.url),
  validateJsonWorker: new URL("./validate-json.worker.ts", import.meta.url),
};

export const createWorker = (url: URL) =>
  new Worker(new URL(url, import.meta.url), {
    type: "module",
  });

const workers = {
  readJsonWorker: createWorker(workerUrl.readJsonWorker),
  parseJsonWorker: createWorker(workerUrl.parseJsonWorker),
  validateJsonWorker: createWorker(workerUrl.validateJsonWorker),
};

export default workers;
