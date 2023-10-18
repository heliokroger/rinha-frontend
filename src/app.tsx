import { Suspense, lazy, useEffect, useRef, useState } from "react";

import { parseJsonWorker, validateJsonWorker } from "./workers";
import { JsonLine } from "./types";
import {
  addPerformanceNotification,
  clearNotifications,
} from "./notifications";

const treeViewer = import("./tree-viewer");
const TreeViewer = lazy(() => treeViewer);

const $content = document.querySelector(".center-content")! as HTMLElement;
const $root = document.getElementById("root")!;

export default function App() {
  const [showTreeViewer, setShowTreeViewer] = useState<null | boolean>(null);
  const [initialRows, setInitialRows] = useState<null | JsonLine[]>(null);

  const fileNameRef = useRef("");
  const startRenderingTimeRef = useRef<number | null>(null);
  const firstChunkLoaded = useRef(false);

  useEffect(() => {
    if (showTreeViewer && initialRows) {
      $content.style.display = "none";
      $root.style.display = "block";
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

          validateJsonWorker.onmessage = (event: MessageEvent<boolean>) => {
            if (!event.data) {
              firstChunkLoaded.current = false;

              setShowTreeViewer(false);
              $content.style.display = "flex";
              $root.style.display = "none";
              document.getElementById("error")!.style.display = "block";
            }

            addPerformanceNotification(
              "⏰ total parsing time: ",
              performance.now() - startRenderingTimeRef.current!
            );

            validateJsonWorker.onmessage = null;
          };

          validateJsonWorker.postMessage(file);

          setShowTreeViewer(true);

          parseJsonWorker.onmessage = (event: MessageEvent<JsonLine[]>) => {
            setInitialRows(event.data);

            parseJsonWorker.onmessage = null;
          };

          parseJsonWorker.postMessage({
            reset: true,
            file,
            from: 0,
            to: 1000,
          });
        }
      };
    }

    return () => {
      if (fileInput) fileInput.onchange = null;
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
