import { createPerformanceNotification } from "./components/notifications";
import {
  createTreeViewer,
  state as treeViewerState,
} from "./components/tree-viewer";
import { validateJsonWorker } from "./workers";

const $fileInput = document.getElementById("file-input")!;
const $root = document.getElementById("root")!;
const $error = document.getElementById("error")!;

const $fileSelectionContainer = document.querySelector(
  ".file-selection-container"
) as HTMLDivElement;
const $notificationContainer = document.querySelector(
  ".notification-container"
) as HTMLDivElement;

const clearNotifications = () => {
  const [, ...notifications] = Array.from($notificationContainer.children);
  for (const notification of notifications) {
    notification.remove();
  }
};

$fileInput.onchange = (event: Event) => {
  const start = performance.now();
  clearNotifications();
  const target = event.target as HTMLInputElement;

  if (target.files && target.files.length) {
    const [file] = target.files;

    $fileSelectionContainer.style.display = "none";

    createTreeViewer(file).then(($treeViewer) => {
      $root.appendChild($treeViewer);

      $notificationContainer.appendChild(
        createPerformanceNotification(
          `⏰ rendered first chunk in: `,
          performance.now() - start
        )
      );
    });

    validateJsonWorker.onmessage = (event: MessageEvent<boolean>) => {
      if (!event.data) {
        $fileSelectionContainer.style.display = "flex";
        $root.innerHTML = "";

        if (treeViewerState.observer) treeViewerState.observer.disconnect();

        $error.style.display = "block";
      }

      $notificationContainer.appendChild(
        createPerformanceNotification(
          `⏰ fully parsed json in: `,
          performance.now() - start
        )
      );

      validateJsonWorker.onmessage = null;
    };

    validateJsonWorker.postMessage(file);
  }
};
