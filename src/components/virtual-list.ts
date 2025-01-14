import Logger from "../logger";
import styles from "./tree-viewer.module.scss";

const THRESHOLD = 50;

type Arguments = {
  itemHeight: number;
  renderFirstBatch: (itemsPerPage: number) => DocumentFragment;
  renderRow: (index: number) => string;
  onRequestRows: () => Promise<void> | void;
};

const logger = new Logger("VIRTUAL LIST");

export const createVirtualList = ({
  itemHeight,
  renderFirstBatch,
  renderRow,
  onRequestRows,
}: Arguments) => {
  const state = { itemsPerPage: 0, listItems: [] as Element[] };

  const $virtualList = document.createElement("div");
  $virtualList.tabIndex = 0;
  $virtualList.style.height = "100%";
  $virtualList.style.overflow = "auto";
  $virtualList.style.overscrollBehavior = "none";

  const $outer = document.createElement("div");
  $outer.tabIndex = 0;
  $virtualList.appendChild($outer);

  const $inner = document.createElement("ul");
  $inner.className = styles["list-container"];
  $outer.appendChild($inner);

  const render = async () => {
    const sTop = $virtualList.scrollTop;

    const requestMoreOffset =
      $virtualList.scrollHeight - $virtualList.clientHeight - THRESHOLD;

    if (sTop >= requestMoreOffset) {
      logger.log("Requesting more lines");
      await onRequestRows();
    }

    const topNum = Math.floor(sTop / itemHeight);

    const remainingPx = sTop % itemHeight;
    const offset = Math.max(topNum, 0);
    $inner.style.transform = `translateY(${sTop - remainingPx}px)`;

    for (let i = 0; i < state.listItems.length; i++) {
      const $child = state.listItems[i];
      $child.innerHTML = renderRow(offset + i);
    }
  };

  const updateRowCount = (count: number) => {
    $outer.style.height = `${count * itemHeight}px`;

    if (count < state.itemsPerPage) {
      $inner.style.height = `${count * itemHeight}px`;
    }
  };

  const onPaint = () => {
    state.itemsPerPage = Math.ceil($virtualList.clientHeight / itemHeight);
    $inner.style.height = `${state.itemsPerPage * itemHeight}px`;

    const fragment = renderFirstBatch(state.itemsPerPage);
    state.listItems = Array.from(fragment.children);

    $inner.appendChild(fragment);
  };

  $virtualList.addEventListener("scroll", () => render());
  logger.log("Attached virtual list listener");

  return { $virtualList, updateRowCount, onPaint };
};
