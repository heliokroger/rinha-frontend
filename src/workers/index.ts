const readJsonWorker = new Worker(
  new URL("./read-json.worker.ts", import.meta.url),
  {
    type: "module",
  }
);

const parseJsonWorker = new Worker(
  new URL("./parse-json.worker.ts", import.meta.url),
  {
    type: "module",
  }
);

const validateJsonWorker = new Worker(
  new URL("./validate-json.worker.ts", import.meta.url),
  {
    type: "module",
  }
);

const workers = { readJsonWorker, parseJsonWorker, validateJsonWorker };

export default workers;
