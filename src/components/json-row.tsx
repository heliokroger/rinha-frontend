import cn from "classnames";
import type { ReactNode } from "react";
import styles from "./json-row.module.scss";
import { JsonLine } from "../types";

export type JsonRowProps = {
  row: JsonLine;
};

const IDENTATION_SPACING = 15;
const IDENTATION_LINE_OFFSET = 2;

export default function JsonRow({ row }: JsonRowProps) {
  const { content, nestLevel, arrayIndex } = row;

  const hasArrayIndex = arrayIndex !== undefined;

  const tokens =
    /"(.*)":\s?(".*"|-?[0-9]+(.?[0-9]+)?|null|true|false|{|\[)(,)?/gm.exec(
      content
    );

  const getValueType = (value: string) => {
    const firstChar = value[0];

    if (value.startsWith('"')) return "string";
    if (value === "null") return "null";
    if (value === "false" || value === "true") return "boolean";
    if (
      firstChar === "{" ||
      firstChar === "[" ||
      firstChar === "}" ||
      firstChar === "]"
    )
      return "bracket";

    return "number";
  };

  const lines = Array.from({ length: nestLevel }).map((_, i) => (
    <div
      key={`identation-${i}`}
      className={styles.line}
      style={{ left: i * IDENTATION_SPACING + IDENTATION_LINE_OFFSET }}
    ></div>
  ));

  const renderRow = (children: ReactNode) => {
    return (
      <>
        {lines}
        <span
          className={styles.row}
          style={{ marginLeft: nestLevel * IDENTATION_SPACING }}
        >
          {hasArrayIndex && (
            <span className={styles["array-index"]}>{arrayIndex}: </span>
          )}
          {children}
        </span>
      </>
    );
  };

  if (tokens !== null) {
    const [, key, value] = tokens;

    return renderRow(
      <>
        <span className={styles["object-key"]}>{key}</span>
        <span>: </span>
        <span className={cn(styles["value"], styles[getValueType(value)])}>
          {value}
        </span>
      </>
    );
  }

  return renderRow(
    <span className={cn(styles["value"], styles[getValueType(content)])}>
      {content.endsWith(",") ? content.slice(0, -1) : content}
    </span>
  );
}
