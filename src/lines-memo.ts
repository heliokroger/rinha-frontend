import { createListItem } from "./components/json-line";
import type { JsonLine } from "./types";

export const getMemoKey = (line: JsonLine) =>
  `${line.nestLevel}${line.arrayIndex ?? ""}${line.content}`;

export const commonLinesMemo = new Map<string, string>();

const lines: JsonLine[] = [
  {
    content: "{",
    nestLevel: 0,
  },
  {
    content: "}",
    nestLevel: 0,
  },
  {
    content: "[",
    nestLevel: 0,
  },
  {
    content: "]",
    nestLevel: 0,
  },
];

lines.forEach((line) => {
  commonLinesMemo.set(getMemoKey(line), createListItem(line).innerHTML);
});
