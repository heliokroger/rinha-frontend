import { createListItem } from "./json-line";
import { parseJson, state as parserState } from "../parse-json";
import styles from "./tree-viewer.module.scss";
import { createVirtualList } from "./virtual-list";
import type { JsonLine } from "../types";

const ITEM_HEIGHT = 20;
const MIN_NUM_OF_ROWS = 100;

export const createTreeViewer = (onRenderFirstBatch: () => void) => {
  const state = {
    lineMemo: new Map<JsonLine, string>(),
  };

  const $section = document.createElement("section");
  $section.className = styles.content;

  const $fileName = document.createElement("h2");
  $fileName.className = styles["file-name"];

  $section.appendChild($fileName);

  const { $virtualList, $inner, updateRowCount, onPaint } = createVirtualList({
    itemHeight: ITEM_HEIGHT,
    renderRow: (index) => {
      const line = parserState.lines[index];

      if (state.lineMemo.has(line)) return state.lineMemo.get(line)!;

      const $li = createListItem(line);
      state.lineMemo.set(line, $li.innerHTML);

      return $li.innerHTML;
    },
    renderFirstBatch: (itemsPerPage) => {
      const fragment = document.createDocumentFragment();

      for (let i = 0; i < itemsPerPage; i++) {
        const line = parserState.lines[i];

        if (!line) break;

        const $li = createListItem(line);
        state.lineMemo.set(line, $li.innerHTML);

        fragment.appendChild($li);
      }

      $inner.appendChild(fragment);
      onRenderFirstBatch();
    },
    onRequestRows: async () => {
      return parseJson({
        reset: false,
      }).then(() => {
        updateRowCount(parserState.lines.length);
      });
    },
  });

  $section.appendChild($virtualList);

  const setFile = (file: File) => {
    $fileName.textContent = file.name;

    parseJson({
      reset: true,
      minNumOfRows: MIN_NUM_OF_ROWS,
      file,
    }).then(() => {
      updateRowCount(parserState.lines.length);
      onPaint();
    });
  };

  return { $treeViewer: $section, setFile };
};
