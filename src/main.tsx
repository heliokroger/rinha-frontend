import {
  addPerformanceNotification,
  clearNotifications,
} from "./components/notifications";
import {
  getTreeViewer,
  state as treeViewerState,
} from "./components/tree-viewer";
import { validateJsonWorker } from "./workers";

const $fileInput = document.getElementById("file-input")!;
const $root = document.getElementById("root")!;
const $error = document.getElementById("error")!;

const $content = document.querySelector(".center-content")! as HTMLDivElement;

$fileInput.onchange = (event: Event) => {
  const start = performance.now();
  clearNotifications();
  const target = event.target as HTMLInputElement;

  if (target.files && target.files.length) {
    const [file] = target.files;

    $content.style.display = "none";

    const $treeViewer = getTreeViewer(file);
    $root.appendChild($treeViewer);

    validateJsonWorker.onmessage = (event: MessageEvent<boolean>) => {
      if (!event.data) {
        $content.style.display = "flex";
        $root.innerHTML = "";

        if (treeViewerState.observer) treeViewerState.observer.disconnect();

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
