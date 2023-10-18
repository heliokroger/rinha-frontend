export const parseJsonWorker = new Worker(
  new URL("./parse-json.worker.ts", import.meta.url),
  {
    type: "module",
  }
);

export const validateJsonWorker = new Worker(
  new URL("./validate-json.worker.ts", import.meta.url),
  {
    type: "module",
  }
);
