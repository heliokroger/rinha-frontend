import { createListItem } from "./json-line";
import { parseJson, state as parserState } from "../parse-json";
import styles from "./tree-viewer.module.scss";
import { createVirtualList } from "./virtual-list";

const LINES_PER_BATCH = 100;
const ITEM_HEIGHT = 20;

type State = {
  numberOfRows: number;
};

export const state: State = { numberOfRows: LINES_PER_BATCH };

const getListItems = (itemsPerPage: number) => {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < itemsPerPage; i++) {
    const line = parserState.lines[i];
    if (!line) break;
    fragment.appendChild(createListItem(line));
  }

  return fragment;
};

export const createTreeViewer = async (file: File) => {
  const $section = document.createElement("section");
  $section.className = styles.content;

  const $fileName = document.createElement("h2");
  $fileName.className = styles["file-name"];
  $fileName.textContent = file.name;

  // $section.appendChild($fileName);

  const { $virtualList, $inner, updateRowCount, onPaint } = createVirtualList({
    itemHeight: ITEM_HEIGHT,
    renderRow: (index) => {
      const line = parserState.lines[index];
      return createListItem(line);
    },
    renderFirstBatch: (itemsPerPage) => {
      $inner.appendChild(getListItems(itemsPerPage));
    },
    onRequestRows: () => {
      state.numberOfRows += LINES_PER_BATCH;

      parseJson({
        reset: false,
        numberOfRows: state.numberOfRows,
      }).then(() => {
        updateRowCount(parserState.lines.length);
      });
    },
  });

  $section.appendChild($virtualList);

  return parseJson({
    reset: true,
    file,
    numberOfRows: LINES_PER_BATCH,
  }).then(() => {
    updateRowCount(parserState.lines.length);

    requestAnimationFrame(() => onPaint());

    return $section;
  });
};
