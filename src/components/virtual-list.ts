import styles from "./tree-viewer.module.scss";

const THRESHOLD = 30;

type Arguments = {
  itemHeight: number;
  renderFirstBatch: (itemsPerPage: number) => void;
  renderRow: (index: number) => HTMLElement;
  onRequestRows: () => void;
};

export const createVirtualList = ({
  itemHeight,
  renderFirstBatch,
  renderRow,
  onRequestRows,
}: Arguments) => {
  const $virtualList = document.createElement("div");
  $virtualList.style.height = "100%";
  $virtualList.style.overflow = "auto";

  const $outer = document.createElement("div");
  $outer.tabIndex = 0;
  $virtualList.appendChild($outer);

  const $inner = document.createElement("ul");
  $inner.className = styles["list-container"];
  $outer.appendChild($inner);

  const render = () => {
    const sTop = $virtualList.scrollTop;

    if (
      sTop >
      $virtualList.scrollHeight - $virtualList.clientHeight - THRESHOLD
    ) {
      onRequestRows();
    }

    const topNum = Math.floor(sTop / itemHeight);

    const remainingPx = sTop % itemHeight;
    const offset = Math.max(topNum, 0);
    $inner.style.transform = `translateY(${sTop - remainingPx}px)`;

    const children = Array.from($inner.children);

    for (let i = 0; i < children.length; i++) {
      const $child = children[i];
      $child.replaceChildren(...renderRow(offset + i).children);
    }
  };

  const updateRowCount = (count: number) => {
    $outer.style.height = `${count * itemHeight}px`;
  };

  const onPaint = () => {
    const itemsPerPage = Math.ceil($virtualList.clientHeight / itemHeight);
    $inner.style.height = `${itemsPerPage * itemHeight}px`;

    renderFirstBatch(itemsPerPage);
  };

  $virtualList.addEventListener("scroll", () => render());

  return { $virtualList, $inner, updateRowCount, onPaint };
};