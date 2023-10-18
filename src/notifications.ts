const footer = document.querySelector("footer")!;

export const addPerformanceNotification = (message: string, ms: number) => {
  const $p = document.createElement("p");

  $p.innerText = message;

  const $span = document.createElement("span");
  $span.innerText = `${Math.round(ms)}ms`;
  $span.className = "bold";

  $p.appendChild($span);

  footer.appendChild($p);
};

export const clearNotifications = () => {
  const { children } = footer;
  const [, ...notifications] = Array.from(children);

  notifications.forEach((child) => {
    child.remove();
  });
};
