import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";
import db, { Table } from "./db";

db.table(Table.Chunks).clear();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
