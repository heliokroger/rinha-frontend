import { createListItem } from "./json-line";
import { parseJson, state as parserState } from "../parse-json";
import styles from "./tree-viewer.module.scss";
import { createVirtualList } from "./virtual-list";
import { commonLinesMemo, getMemoKey } from "../lines-memo";

const ITEM_HEIGHT = 20;
const MIN_NUM_OF_ROWS = 70;

export const createTreeViewer = (onRenderFirstBatch: () => void) => {
  const state = {
    lineMemo: commonLinesMemo,
  };

  const $section = document.createElement("section");
  $section.className = styles.content;

  const $fileName = document.createElement("h2");
  $fileName.className = styles["file-name"];

  $section.appendChild($fileName);

  const { $virtualList, updateRowCount, onPaint } = createVirtualList({
    itemHeight: ITEM_HEIGHT,
    renderRow: (index) => {
      const line = parserState.lines[index];
      const memoKey = getMemoKey(line);

      if (state.lineMemo.has(memoKey)) return state.lineMemo.get(memoKey)!;

      const $li = createListItem(line);
      state.lineMemo.set(memoKey, $li.innerHTML);

      return $li.innerHTML;
    },
    renderFirstBatch: (itemsPerPage) => {
      const fragment = document.createDocumentFragment();

      for (let i = 0; i < itemsPerPage; i++) {
        const line = parserState.lines[i];
        if (!line) break;
        const memoKey = getMemoKey(line);

        const $li = createListItem(line);
        state.lineMemo.set(memoKey, $li.innerHTML);

        fragment.appendChild($li);
      }

      setTimeout(onRenderFirstBatch);

      return fragment;
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
    $fileName.appendChild(document.createTextNode(file.name));

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
