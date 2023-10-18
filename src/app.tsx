import { Suspense, lazy, useEffect, useRef, useState } from "react";

import workers from "./workers";
import { MAX_FILE_SIZE_FOR_PARSING } from "./constants";
import { JsonLine } from "./types";
import { recreate } from "./db";
import {
  addPerformanceNotification,
  clearNotifications,
} from "./notifications";

const treeViewer = import("./tree-viewer");
const TreeViewer = lazy(() => treeViewer);

export default function App() {
  const [showTreeViewer, setShowTreeViewer] = useState<null | boolean>(null);
  const [initialRows, setInitialRows] = useState<null | JsonLine[]>(null);

  const fileNameRef = useRef("");
  const startRenderingTimeRef = useRef<number | null>(null);
  const firstChunkLoaded = useRef(false);

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
        clearNotifications();

        if (target.files && target.files.length) {
          const [file] = target.files;

          startRenderingTimeRef.current = performance.now();
          fileNameRef.current = file.name;

          if (file.size < MAX_FILE_SIZE_FOR_PARSING) {
            workers.validateJsonWorker.onmessage = (
              event: MessageEvent<boolean>
            ) => {
              if (!event.data) {
                workers.readJsonWorker.terminate();
                workers.readJsonWorker = new Worker(
                  new URL("./workers/read-json.worker.ts", import.meta.url),
                  {
                    type: "module",
                  }
                );

                firstChunkLoaded.current = false;

                recreate();

                document.getElementById("error")!.style.display = "block";
              } else {
                setShowTreeViewer(true);
              }

              workers.validateJsonWorker.onmessage = null;
            };

            workers.validateJsonWorker.postMessage(file);
          } else {
            setShowTreeViewer(true);
          }

          workers.parseJsonWorker.onmessage = (
            event: MessageEvent<JsonLine[]>
          ) => {
            setInitialRows(event.data);

            workers.parseJsonWorker.onmessage = null;
          };

          workers.readJsonWorker.onmessage = (
            event: MessageEvent<number | string>
          ) => {
            if (!firstChunkLoaded.current) {
              workers.parseJsonWorker.postMessage({
                reset: true,
                content: event.data,
                from: 0,
                to: 100,
              });

              firstChunkLoaded.current = true;
            }

            if (typeof event.data === "number") {
              addPerformanceNotification(
                "⏰ processing time: ",
                Math.round(event.data)
              );

              workers.readJsonWorker.onmessage = null;
            }
          };

          workers.readJsonWorker.postMessage(file);
        }
      };
    }

    return () => {
      if (fileInput) fileInput.onchange = null;
      workers.readJsonWorker.onmessage = null;
      workers.parseJsonWorker.onmessage = null;
      workers.validateJsonWorker.onmessage = null;
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
