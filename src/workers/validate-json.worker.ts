import mainWasmUrl from "../main.wasm?url";
import "./wasm_exec";

const go = new Go();

WebAssembly.instantiateStreaming(fetch(mainWasmUrl), go.importObject).then(
  (result) => {
    go.run(result.instance);
  }
);

self.onmessage = async (event: MessageEvent<File>) => {
  const text = await event.data.text();
  self.postMessage(validateJson(text));
};
