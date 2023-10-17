import { useEffect, useLayoutEffect, useState } from "react";
import type { Index, IndexRange, ListRowRenderer } from "react-virtualized";

import JsonRow from "./components/json-row";
import { parseJsonWorker } from "./workers";

import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";
import InfiniteLoader from "react-virtualized/dist/commonjs/InfiniteLoader";
import List from "react-virtualized/dist/commonjs/List";
import WindowScroller from "react-virtualized/dist/commonjs/WindowScroller";
import type { JsonLine } from "./types";

import styles from "./tree-viewer.module.scss";
import Logger from "./workers/logger";

export type TreeViewerProps = {
  initialRows: JsonLine[];
  fileName: string;
  startRenderingTime: number;
};

const logger = new Logger("TREE VIEWER");

export default function TreeViewer({
  initialRows,
  fileName,
  startRenderingTime,
}: TreeViewerProps) {
  const [rows, setRows] = useState<JsonLine[]>([]);

  useLayoutEffect(() => {
    const diff = Math.round(performance.now() - startRenderingTime);

    logger.log(`Fair rendering time ${Math.round(diff)}ms`);

    const $p = document.createElement("p");
    $p.innerText = `⏰ render time: ${Math.round(diff)}ms`;

    document.querySelector("footer")!.appendChild($p);
  }, [startRenderingTime]);

  useEffect(() => {
    parseJsonWorker.onmessage = (event) => {
      setRows((prev) => [...prev, ...event.data]);
    };

    return () => {
      parseJsonWorker.onmessage = null;
    };
  }, []);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const isRowLoaded = (params: Index) => !!rows[params.index];

  const loadMoreRows = async (params: IndexRange) => {
    parseJsonWorker.postMessage({
      from: params.startIndex,
      to: params.stopIndex,
    });
    return null;
  };

  const rowRenderer: ListRowRenderer = ({ key, style, index }) => {
    return (
      <div key={key} style={style}>
        <JsonRow row={rows[index]} />
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
                  rowCount={100000}
                >
                  {({ onRowsRendered, registerChild }) => (
                    <List
                      autoHeight
                      onRowsRendered={onRowsRendered}
                      ref={registerChild}
                      height={height}
                      isScrolling={isScrolling}
                      onScroll={onChildScroll}
                      rowCount={rows.length}
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
