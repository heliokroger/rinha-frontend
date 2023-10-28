import { addPerformanceNotification } from "./notifications";
import { parseJson } from "./parse-json";
import { getTreeViewer } from "./tree-viewer";
import { validateJsonWorker } from "./workers";

const $fileInput = document.getElementById("file-input")!;
const $root = document.getElementById("root")!;
const $error = document.getElementById("error")!;

const $content = document.querySelector(".center-content")! as HTMLDivElement;

$fileInput.onchange = (event: Event) => {
  const start = performance.now();
  const target = event.target as HTMLInputElement;

  if (target.files && target.files.length) {
    const [file] = target.files;

    parseJson({
      reset: true,
      file,
      numberOfRows: 50,
    }).then(() => {
      $root.style.display = "block";
      $content.style.display = "none";

      const $treeViewer = getTreeViewer(file);
      $root.appendChild($treeViewer);

      addPerformanceNotification(
        `⏰ rendered first chunk in: `,
        performance.now() - start
      );
    });

    validateJsonWorker.onmessage = (event: MessageEvent<boolean>) => {
      if (!event.data) {
        $content.style.display = "flex";
        $root.style.display = "none";
        $error.style.display = "block";
      }

      addPerformanceNotification(
        `⏰ fully parsed json in: `,
        performance.now() - start
      );

      validateJsonWorker.onmessage = null;
    };

    validateJsonWorker.postMessage(file);
  }
};
