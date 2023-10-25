import { useEffect } from "react";
import type { Index, IndexRange, ListRowRenderer } from "react-virtualized";

import JsonRow from "./components/json-row";

import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";
import InfiniteLoader from "react-virtualized/dist/commonjs/InfiniteLoader";
import List from "react-virtualized/dist/commonjs/List";
import WindowScroller from "react-virtualized/dist/commonjs/WindowScroller";

import styles from "./tree-viewer.module.scss";
import Logger from "./logger";
import { addPerformanceNotification, formatTime } from "./notifications";
import { parseJson, state as parserState } from "./parse-json";

export type TreeViewerProps = {
  startRenderingTime: number | null;
};

const logger = new Logger("TREE VIEWER");

// TODO: Get rows from disk
// TODO: Fix blank space on top of list
export default function TreeViewer({ startRenderingTime }: TreeViewerProps) {
  useEffect(() => {
    if (startRenderingTime) {
      const diff = performance.now() - startRenderingTime;

      logger.log(`Fair rendering time ${formatTime(diff)}`);

      addPerformanceNotification("⏰ rendering time: ", diff);
    }
  }, [startRenderingTime]);

  const isRowLoaded = (params: Index) => !!parserState.rows[params.index];

  const loadMoreRows = async (params: IndexRange) => {
    return parseJson({
      reset: false,
      from: params.startIndex,
      to: params.stopIndex,
    });
  };

  const rowRenderer: ListRowRenderer = ({ key, style, index }) => {
    return (
      <div key={key} style={style}>
        <JsonRow row={parserState.rows[index]} />
      </div>
    );
  };

  return (
    <section className={styles.content}>
      <h2 className={styles["file-name"]}>{parserState.file?.name}</h2>
      <div className={styles["list-container"]}>
        <AutoSizer disableHeight>
          {({ width }) => (
            <WindowScroller>
              {({ height, isScrolling, onChildScroll, scrollTop }) => (
                <InfiniteLoader
                  isRowLoaded={isRowLoaded}
                  loadMoreRows={loadMoreRows}
                  rowCount={1e9}
                  threshold={30}
                >
                  {({ onRowsRendered, registerChild }) => (
                    <List
                      autoHeight
                      onRowsRendered={onRowsRendered}
                      ref={registerChild}
                      height={height}
                      isScrolling={isScrolling}
                      onScroll={onChildScroll}
                      rowCount={parserState.rowsCount}
                      rowHeight={20}
                      rowRenderer={rowRenderer}
                      scrollTop={scrollTop}
                      width={width}
                      containerStyle={{ overflowX: "auto" }}
                    />
                  )}
                </InfiniteLoader>
              )}
            </WindowScroller>
          )}
        </AutoSizer>
      </div>
    </section>
  );
}
