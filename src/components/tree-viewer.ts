import { createListItem } from "./json-line";
import { parseJson, state as parserState } from "../parse-json";
import styles from "./tree-viewer.module.scss";
import type { JsonLine } from "../types";
import { addPerformanceNotification } from "./notifications";

const getListItems = (lines: JsonLine[]) => {
  const fragment = document.createDocumentFragment();

  for (const line of lines) {
    const $listItem = createListItem(line);
    fragment.appendChild($listItem);
  }

  return fragment;
};

const LINES_PER_BATCH = 70;

type State = {
  observer: IntersectionObserver | null;
  from: number;
  to: number;
};

export const state: State = { observer: null, from: 0, to: 100 };

export const getTreeViewer = (file: File) => {
  const start = performance.now();

  const $section = document.createElement("section");
  $section.className = styles.content;

  const $fileName = document.createElement("h2");
  $fileName.className = styles["file-name"];
  $fileName.textContent = file.name;

  $section.appendChild($fileName);

  const $ul = document.createElement("ul");
  $ul.className = styles["list-container"];

  $section.appendChild($ul);

  $ul.appendChild(getListItems(parserState.lines));

  const $trigger = document.createElement("div");
  $trigger.style.height = "10px";
  $section.appendChild($trigger);

  const renderLines = () => {
    const slice = parserState.lines.slice(state.from, state.to);
    $ul.appendChild(getListItems(slice));
  };

  state.observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      const hasLoadedIndex = parserState.lines[state.to];

      if (hasLoadedIndex) {
        renderLines();
      } else {
        state.from += LINES_PER_BATCH;
        state.to += LINES_PER_BATCH;

        parseJson({
          reset: false,
          file,
          numberOfRows: state.to,
        }).then(renderLines);
      }
    }
  });

  state.observer.observe($trigger);

  parseJson({
    reset: true,
    file,
    numberOfRows: LINES_PER_BATCH,
  }).then(() => {
    renderLines();

    addPerformanceNotification(
      `⏰ rendered first chunk in: `,
      performance.now() - start
    );
  });

  return $section;
};
