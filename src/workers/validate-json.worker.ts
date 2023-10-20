import Logger from "../logger";
import "./wasm_exec";

const go = new Go();

WebAssembly.instantiateStreaming(
  fetch("validate-json.wasm"),
  go.importObject
).then((result) => {
  go.run(result.instance);
});

const logger = new Logger("VALIDATE JSON WORKER");

self.onmessage = (event: MessageEvent<File>) => {
  const start = performance.now();
  self.postMessage(validateJson(event.data));

  const end = performance.now();
  logger.log(`Took ${Math.round(end - start)}ms`);
};
