import type { JsonLine } from "../types";
import styles from "./json-line.module.scss";

const IDENTATION_SPACING = 15;
const IDENTATION_LINE_OFFSET = 2;

const isValueABracket = (value: string) => {
  const firstChar = value[0];

  return (
    firstChar === "{" ||
    firstChar === "[" ||
    firstChar === "}" ||
    firstChar === "]"
  );
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
  $span.tabIndex = 0;
  $span.style.marginLeft = `${nestLevel * IDENTATION_SPACING}px`;

  if (arrayIndex !== undefined) {
    const $arrayIndex = document.createElement("span");
    $arrayIndex.className = styles["array-index"];
    $arrayIndex.appendChild(document.createTextNode(`${arrayIndex}: `));

    $span.appendChild($arrayIndex);
  }

  const $value = document.createElement("span");
  $value.className = styles.value;

  if (tokens !== null) {
    const [, key, value] = tokens;
    const $objectKey = document.createElement("span");
    $objectKey.className = styles["object-key"];
    $objectKey.appendChild(document.createTextNode(`${key}: `));

    $span.appendChild($objectKey);

    if (isValueABracket(value)) $value.classList.add(styles.bracket);
    $value.appendChild(document.createTextNode(value));
    $span.appendChild($value);
  } else {
    if (isValueABracket(content)) $value.classList.add(styles.bracket);

    $value.appendChild(
      document.createTextNode(
        content.endsWith(",") ? content.slice(0, -1) : content
      )
    );

    $span.appendChild($value);
  }

  $li.appendChild($span);

  return $li;
};
