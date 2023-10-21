const footer = document.querySelector("footer")!;

const formatTime = (ms: number) => {
  const seconds = ms / 1000;
  if (seconds > 1) return `${seconds.toFixed(2)}s`;
  return `${ms}ms`;
};

export const addPerformanceNotification = (message: string, ms?: number) => {
  const $p = document.createElement("p");

  $p.innerText = message;

  if (ms) {
    const $span = document.createElement("span");
    $span.innerText = formatTime(Math.round(ms));
    $span.className = "bold";

    $p.appendChild($span);
  }

  footer.appendChild($p);
};

export const clearNotifications = () => {
  const { children } = footer;
  const [, ...notifications] = Array.from(children);

  notifications.forEach((child) => {
    child.remove();
  });
};
