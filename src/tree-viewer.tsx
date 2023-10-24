import { useLayoutEffect } from "react";
import type { Index, IndexRange, ListRowRenderer } from "react-virtualized";

import JsonRow from "./components/json-row";

import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";
import InfiniteLoader from "react-virtualized/dist/commonjs/InfiniteLoader";
import List from "react-virtualized/dist/commonjs/List";
import WindowScroller from "react-virtualized/dist/commonjs/WindowScroller";

import styles from "./tree-viewer.module.scss";
import Logger from "./logger";
import { addPerformanceNotification } from "./notifications";
import { parseJson, state } from "./parse-json";

export type TreeViewerProps = {
  fileName: string;
  startRenderingTime: number;
};

const logger = new Logger("TREE VIEWER");

export default function TreeViewer({
  fileName,
  startRenderingTime,
}: TreeViewerProps) {
  useLayoutEffect(() => {
    const diff = Math.round(performance.now() - startRenderingTime);

    logger.log(`Fair rendering time ${diff}ms`);

    addPerformanceNotification("⏰ rendering time: ", diff);
  }, [startRenderingTime]);

  const isRowLoaded = (params: Index) => !!state.rows[params.index];

  const loadMoreRows = (params: IndexRange) => {
    return parseJson({
      reset: false,
      from: params.startIndex,
      to: params.stopIndex,
    });
  };

  const rowRenderer: ListRowRenderer = ({ key, style, index }) => {
    return (
      <div key={key} style={style}>
        <JsonRow row={state.rows[index]} />
      </div>
    );
  };

  return (
    <section className={styles.content}>
      <h2 className={styles["file-name"]}>{fileName}</h2>
      <div className={styles["list-container"]}>
        <AutoSizer disableHeight>
          {({ width }) => (
            <WindowScroller>
              {({ height, isScrolling, onChildScroll, scrollTop }) => (
                <InfiniteLoader
                  isRowLoaded={isRowLoaded}
                  loadMoreRows={loadMoreRows}
                  rowCount={1e9}
                >
                  {({ onRowsRendered, registerChild }) => (
                    <List
                      autoHeight
                      onRowsRendered={onRowsRendered}
                      ref={registerChild}
                      height={height}
                      isScrolling={isScrolling}
                      onScroll={onChildScroll}
                      rowCount={state.rows.length}
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
