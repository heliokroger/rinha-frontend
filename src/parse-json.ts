import { JsonLine } from "./types";
import Logger from "./logger";
import type { State, Arguments } from "./parse-json.types";
import db, { Table } from "./db";
import { formatTime } from "./notifications";

const logger = new Logger("PARSE JSON WORKER");

const initialState: State = {
  openingBrackets: [],
  arrays: [],
  rows: [],
  partialStr: "",
  nestLevel: 0,
  rowsCount: 0,
  bytesOffset: 0,
  isInsideString: false,
  file: null,
};

export let state = structuredClone(initialState);

export const CHUNK_SIZE = 1_000; // 1kb

const getNextChunk = async () => {
  if (state.file) {
    const blob = state.file.slice(
      state.bytesOffset,
      state.bytesOffset + CHUNK_SIZE
    );

    state.bytesOffset += CHUNK_SIZE;

    return blob.text();
  }

  return null;
};

const convertChunkToRows = (chunk: string): JsonLine[] => {
  const rows: JsonLine[] = [];
  const tokens = chunk.trim().split("");

  const addRow = (content: string, arrayIndex?: number) => {
    const row: JsonLine = { content, nestLevel: state.nestLevel };
    if (arrayIndex !== undefined) row.arrayIndex = arrayIndex;

    rows.push(row);
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!state.isInsideString && token === " ") continue;

    const lastArray = state.arrays.at(-1);
    const lastOpeningBracket = state.openingBrackets.at(-1);

    const prevContent = state.partialStr.trim();
    state.partialStr = `${state.partialStr}${token}`;

    const isInsideArray = lastOpeningBracket === "[";

    /* Tokens that will make the line break */
    if (
      !state.isInsideString &&
      (token === "{" || token === "[" || token === "}" || token === "]")
    ) {
      /* New block, increases nest level */
      if (token === "{" || token === "[") {
        state.openingBrackets.push(token as State["openingBrackets"][number]);

        /* Opening of a new array */
        if (token === "[") {
          const isKeyValuePair = prevContent.endsWith(":");

          addRow(
            state.partialStr.trim(),
            lastArray && !isKeyValuePair ? ++lastArray.currentIndex : undefined
          );

          state.arrays.push({ currentIndex: -1 });
        } else {
          addRow(
            state.partialStr.trim(),
            lastArray && isInsideArray ? ++lastArray.currentIndex : undefined
          );
        }

        state.nestLevel++;

        state.partialStr = "";
        continue;
      }

      /* Removes last opening bracket from the list */
      state.openingBrackets.pop();

      /* Closing of an array */
      if (token === "]") state.arrays.pop();

      /* Block end, decreases nest level */
      if (prevContent) {
        addRow(
          prevContent,
          lastArray && isInsideArray ? ++lastArray.currentIndex : undefined
        );
      }

      state.nestLevel--;

      addRow(token);

      state.partialStr = "";
      continue;
    }

    if (!state.isInsideString && token === ",") {
      /* There was still content being parsed before the comma */
      if (prevContent) {
        addRow(
          state.partialStr.trim(),
          lastArray && isInsideArray ? ++lastArray.currentIndex : undefined
        );
      }

      state.partialStr = "";
      continue;
    }

    /* Toggle string mode */
    if (!prevContent.endsWith("\\") && token === '"')
      state.isInsideString = !state.isInsideString;
  }

  return rows;
};

export const parseJson = async (args: Arguments): Promise<void> => {
  const start = performance.now();
  const { to, file, reset } = args;

  if (reset) state = structuredClone(initialState);
  if (file) state.file = file;

  const isLastInteraction = state.bytesOffset + CHUNK_SIZE > state.file!.size;

  const nextChunk = (await getNextChunk())!;
  const firstChar = nextChunk[0];

  // TODO: Fix for primitives that are separated in chunks
  /* Primitive structure, return a single row and halts */
  if (reset && firstChar !== "{" && firstChar !== "[") {
    // addRow(nextChunk);
    return;
  }

  const rows = convertChunkToRows(nextChunk);

  await db.table(Table.Chunks).add({ rows });

  state.rows = [...state.rows, ...rows];
  state.rowsCount += rows.length;

  /* Number of lines requested is greater than the chunk size */
  if (to > state.rowsCount - 1 && !isLastInteraction) {
    return parseJson({ ...args, reset: false });
  }

  logger.log(`Parsed chunk in ${formatTime(performance.now() - start)}`);
};
