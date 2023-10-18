export enum WorkerUrl {
  ReadJsonWorker = "./read-json.worker.ts",
  ParseJsonWorker = "./parse-json.worker.ts",
  ValidateJsonWorker = "./validate-json.worker.ts",
}

export const createWorker = (url: string) =>
  new Worker(new URL(url, import.meta.url), {
    type: "module",
  });

const workers = {
  readJsonWorker: createWorker("./read-json.worker.ts"),
  parseJsonWorker: createWorker("./parse-json.worker.ts"),
  validateJsonWorker: createWorker("./validate-json.worker.ts"),
};

export default workers;
