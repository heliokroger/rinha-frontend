import { Suspense, lazy, useEffect, useRef, useState } from "react";

import { parseJsonWorker, readJsonWorker, validateJsonWorker } from "./workers";
import { MAX_FILE_SIZE_FOR_PARSING } from "./constants";
import { JsonLine } from "./types";
import db, { Table } from "./db";

const treeViewer = import("./tree-viewer");
const TreeViewer = lazy(() => treeViewer);

export default function App() {
  const [showTreeViewer, setShowTreeViewer] = useState<null | boolean>(null);
  const [initialRows, setInitialRows] = useState<null | JsonLine[]>(null);

  const fileNameRef = useRef("");
  const startRenderingTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (showTreeViewer && initialRows) {
      document.querySelector(".center-content")?.remove();
      document.getElementById("root")!.style.display = "block";
    }
  }, [showTreeViewer, initialRows]);

  useEffect(() => {
    const fileInput = document.getElementById("file-input");

    if (fileInput) {
      fileInput.onchange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        setInitialRows(null);

        if (target.files && target.files.length) {
          const [file] = target.files;

          startRenderingTimeRef.current = performance.now();
          fileNameRef.current = file.name;

          if (file.size < MAX_FILE_SIZE_FOR_PARSING) {
            validateJsonWorker.onmessage = (event: MessageEvent<boolean>) => {
              if (!event.data) {
                document.getElementById("error")!.style.display = "block";
              } else {
                setShowTreeViewer(true);
              }

              validateJsonWorker.onmessage = null;
            };

            validateJsonWorker.postMessage(file);
          } else {
            setShowTreeViewer(true);
          }

          db.table(Table.Chunks)
            .clear()
            .then(() => {
              parseJsonWorker.onmessage = (event: MessageEvent<JsonLine[]>) => {
                setInitialRows(event.data);

                parseJsonWorker.onmessage = null;
              };

              readJsonWorker.onmessage = (
                event: MessageEvent<number | null>
              ) => {
                parseJsonWorker.postMessage({
                  reset: true,
                  from: 0,
                  to: 100,
                });

                if (event.data) {
                  const $p = document.createElement("p");
                  $p.innerText = `⏰ processing time: ${Math.round(
                    event.data
                  )}ms`;

                  document.querySelector("footer")!.appendChild($p);
                  readJsonWorker.onmessage = null;
                }
              };

              readJsonWorker.postMessage(file);
            });
        }
      };
    }

    return () => {
      if (fileInput) fileInput.onchange = null;
      readJsonWorker.onmessage = null;
      parseJsonWorker.onmessage = null;
      validateJsonWorker.onmessage = null;
    };
  }, []);

  if (showTreeViewer && initialRows && startRenderingTimeRef.current) {
    return (
      <Suspense>
        <TreeViewer
          fileName={fileNameRef.current}
          initialRows={initialRows}
          startRenderingTime={startRenderingTimeRef.current}
        />
      </Suspense>
    );
  }

  return null;
}
