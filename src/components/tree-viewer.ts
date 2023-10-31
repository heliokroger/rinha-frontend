import { createListItem, createListItemElement } from "./json-line";
import { parseJson, state as parserState } from "../parse-json";
import styles from "./tree-viewer.module.scss";
import { createVirtualList } from "./virtual-list";
import { commonLinesMemo, getMemoKey } from "../lines-memo";

const ITEM_HEIGHT = 20;

export const createTreeViewer = (onRenderFirstBatch: () => void) => {
  const state = {
    lineMemo: commonLinesMemo,
  };

  const $section = document.createElement("section");
  $section.className = styles.content;

  const $fileName = document.createElement("h2");
  $fileName.className = styles["file-name"];

  $section.appendChild($fileName);

  const {
    $virtualList,
    updateRowCount,
    state: virtualListState,
    onPaint,
  } = createVirtualList({
    itemHeight: ITEM_HEIGHT,
    renderRow: (index) => {
      const line = parserState.lines[index];
      const memoKey = getMemoKey(line);

      if (state.lineMemo.has(memoKey)) return state.lineMemo.get(memoKey)!;

      const $li = createListItem(line);
      state.lineMemo.set(memoKey, $li.innerHTML);

      return $li.innerHTML;
    },
    renderPlaceholderItems(itemsPerPage) {
      const fragment = document.createDocumentFragment();

      for (let i = 0; i < itemsPerPage; i++) {
        const $li = createListItemElement();
        fragment.appendChild($li);
      }

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
  requestAnimationFrame(() => onPaint());

  const setFile = (file: File) => {
    $fileName.appendChild(document.createTextNode(file.name));

    parseJson({
      reset: true,
      minNumOfRows: virtualListState.itemsPerPage,
      file,
    }).then(() => {
      updateRowCount(parserState.lines.length);

      for (let i = 0; i < virtualListState.itemsPerPage; i++) {
        const line = parserState.lines[i];
        if (!line) break;

        const memoKey = getMemoKey(line);

        if (state.lineMemo.has(memoKey)) {
          virtualListState.listItems[i].innerHTML =
            state.lineMemo.get(memoKey)!;

          continue;
        }

        const $li = createListItem(line);
        state.lineMemo.set(memoKey, $li.innerHTML);

        virtualListState.listItems[i].innerHTML = $li.innerHTML;
      }

      onRenderFirstBatch();
    });
  };

  return { $treeViewer: $section, setFile };
};
