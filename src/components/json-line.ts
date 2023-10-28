import type { JsonLine } from "../types";
import styles from "./json-line.module.scss";

const IDENTATION_SPACING = 15;
const IDENTATION_LINE_OFFSET = 2;

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

export const createListItem = (line: JsonLine) => {
  const { content, nestLevel, arrayIndex } = line;

  const $li = document.createElement("li");
  $li.className = styles.line;

  const tokens =
    /"(.*)":\s?(".*"|-?[0-9]+(.?[0-9]+)?|null|true|false|{|\[)(,)?/gm.exec(
      content
    );

  const lines = Array.from({ length: nestLevel }).map((_, i) => {
    const $line = document.createElement("div");
    $line.className = styles["identation-line"];
    $line.style.left = `${i * IDENTATION_SPACING + IDENTATION_LINE_OFFSET}px`;

    return $line;
  });

  for (const $line of lines) {
    $li.appendChild($line);
  }

  const $span = document.createElement("span");
  $span.className = styles["line-content"];
  $span.style.marginLeft = `${nestLevel * IDENTATION_SPACING}px`;

  if (arrayIndex !== undefined) {
    const $arrayIndex = document.createElement("span");
    $arrayIndex.className = styles["array-index"];
    $arrayIndex.textContent = `${arrayIndex}: `;

    $span.appendChild($arrayIndex);
  }

  const $value = document.createElement("span");

  if (tokens !== null) {
    const [, key, value] = tokens;
    const $objectKey = document.createElement("span");
    $objectKey.className = styles["object-key"];
    $objectKey.textContent = key;

    const $colon = document.createElement("span");
    $colon.textContent = ": ";

    $span.appendChild($objectKey);
    $span.appendChild($colon);

    $value.className = `${styles.value} ${styles[getValueType(value)]}`;
    $value.textContent = value;
  } else {
    $value.className = `${styles.value} ${styles[getValueType(content)]}`;
    $value.textContent = content.endsWith(",") ? content.slice(0, -1) : content;
  }

  $span.appendChild($value);

  $li.appendChild($span);

  return $li;
};
