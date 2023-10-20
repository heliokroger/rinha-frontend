import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";
import "./wasm_exec";

const go = new Go();

WebAssembly.instantiateStreaming(
  fetch("validate-json.wasm"),
  go.importObject
).then((result) => {
  go.run(result.instance);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
