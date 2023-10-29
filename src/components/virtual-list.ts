import styles from "./tree-viewer.module.scss";

const THRESHOLD = 30;

type Arguments = {
  itemHeight: number;
  renderFirstBatch: (itemsPerPage: number) => void;
  renderRow: (index: number) => string;
  onRequestRows: () => void;
};

export const createVirtualList = ({
  itemHeight,
  renderFirstBatch,
  renderRow,
  onRequestRows,
}: Arguments) => {
  const state = { itemsPerPage: 0 };

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

    renderFirstBatch(state.itemsPerPage);
  };

  $virtualList.addEventListener("scroll", () => render());

  return { $virtualList, $inner, updateRowCount, onPaint };
};
