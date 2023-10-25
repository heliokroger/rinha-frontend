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
  const [firstChunkLoaded, setFirstChunkLoaded] = useState(false);
  const [jsonValid, setJsonValid] = useState(true);

  const startRenderingTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (firstChunkLoaded && jsonValid) {
      $content.style.display = "none";
      $root.style.display = "block";
    }
  }, [firstChunkLoaded, jsonValid]);

  useEffect(() => {
    const fileInput = document.getElementById("file-input");

    if (fileInput) {
      fileInput.onchange = (event: Event) => {
        const target = event.target as HTMLInputElement;

        if (target.files && target.files.length) {
          clearNotifications();

          setJsonValid(true);

          const [file] = target.files;

          startRenderingTimeRef.current = performance.now();

          validateJsonWorker.onmessage = (event: MessageEvent<boolean>) => {
            if (!event.data) {
              // TODO: Delete the database
              setFirstChunkLoaded(false);
              setJsonValid(false);

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

          parseJson({
            reset: true,
            file,
            from: 0,
            to: 100,
          }).then(() => {
            setFirstChunkLoaded(true);
          });
        }
      };
    }

    return () => {
      if (fileInput) fileInput.onchange = null;
      validateJsonWorker.onmessage = null;
    };
  }, []);

  return (
    <Suspense>
      <TreeViewer startRenderingTime={startRenderingTimeRef.current} />
    </Suspense>
  );
}
