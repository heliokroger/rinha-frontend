import { createPerformanceNotification } from "./components/notifications";
import { createTreeViewer } from "./components/tree-viewer";
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

const attachTreeViewer = () => {
  const treeViewer = createTreeViewer(() => {
    $notificationContainer.appendChild(
      createPerformanceNotification(
        `⏰ rendered first chunk in `,
        performance.now() - state.start
      )
    );
  });

  $root.appendChild(treeViewer.$treeViewer);

  return treeViewer;
};

const state: {
  start: number;
  treeViewer: ReturnType<typeof createTreeViewer>;
} = { start: 0, treeViewer: attachTreeViewer() };

validateJsonWorker.onmessage = (event: MessageEvent<boolean>) => {
  if (!event.data) {
    $fileSelectionContainer.style.display = "flex";
    $root.innerHTML = "";
    state.treeViewer = attachTreeViewer();

    $error.style.display = "block";
  }

  $notificationContainer.appendChild(
    createPerformanceNotification(
      `⏰ fully parsed json in `,
      performance.now() - state.start
    )
  );

  validateJsonWorker.onmessage = null;
};

$fileInput.onchange = (event: Event) => {
  state.start = performance.now();

  clearNotifications();

  const target = event.target as HTMLInputElement;

  if (target.files && target.files.length) {
    const [file] = target.files;

    $fileSelectionContainer.style.display = "none";
    state.treeViewer.setFile(file);

    validateJsonWorker.postMessage(file);
  }
};
