import { Suspense, lazy, useEffect, useRef, useState } from "react";

import { validateJsonWorker } from "./workers";
import {
  addPerformanceNotification,
  clearNotifications,
} from "./notifications";
import { parseJson } from "./parse-json";

const treeViewer = import("./tree-viewer");
const TreeViewer = lazy(() => treeViewer);

const $content = document.querySelector(".center-content")! as HTMLElement;
const $root = document.getElementById("root")!;

export default function App() {
  const [showTreeViewer, setShowTreeViewer] = useState<null | boolean>(null);
  const [parsedFirstChunk, setParsedFirstChunk] = useState(false);

  const fileNameRef = useRef("");
  const startRenderingTimeRef = useRef<number | null>(null);
  const firstChunkLoaded = useRef(false);

  useEffect(() => {
    if (showTreeViewer && parsedFirstChunk) {
      $content.style.display = "none";
      $root.style.display = "block";
    }
  }, [showTreeViewer, parsedFirstChunk]);

  useEffect(() => {
    const fileInput = document.getElementById("file-input");

    if (fileInput) {
      fileInput.onchange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        setParsedFirstChunk(false);
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

          addPerformanceNotification("👉 currently parsing whole file...");

          validateJsonWorker.postMessage(file);

          setShowTreeViewer(true);

          parseJson({
            reset: true,
            file,
            from: 0,
            to: 100,
          }).then(() => setParsedFirstChunk(true));
        }
      };
    }

    return () => {
      if (fileInput) fileInput.onchange = null;
      validateJsonWorker.onmessage = null;
    };
  }, []);

  if (showTreeViewer && parsedFirstChunk && startRenderingTimeRef.current) {
    return (
      <Suspense>
        <TreeViewer
          fileName={fileNameRef.current}
          startRenderingTime={startRenderingTimeRef.current}
        />
      </Suspense>
    );
  }

  return null;
}
