import { JsonLine } from "./types";
import Logger from "./logger";
import type { State, Arguments } from "./parse-json.types";

const logger = new Logger("PARSE JSON WORKER");

const initialState: State = {
  isInsideString: false,
  openingBrackets: [],
  partialStr: "",
  nestLevel: 0,
  currentChunkIndex: 0,
  bytesOffset: 0,
  arrays: [],
  rows: [],
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

const addRow = (content: string, arrayIndex?: number) => {
  const row: JsonLine = { content, nestLevel: state.nestLevel };
  if (arrayIndex !== undefined) row.arrayIndex = arrayIndex;
  state.rows.push(row);
};

const convertChunkToRows = (chunk: string) => {
  const tokens = chunk.trim().split("");

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
      const lastRowIndex = state.rows.length - 1;
      const prevRow = state.rows[lastRowIndex];

      /* The comma belongs to a previous closing bracket */
      if (prevRow.content === "}" || prevRow.content === "]") {
        state.rows[lastRowIndex] = {
          ...state.rows[lastRowIndex],
          content: `${prevRow.content},`,
        };

        state.partialStr = "";
        continue;
      }

      addRow(
        state.partialStr.trim(),
        lastArray && isInsideArray ? ++lastArray.currentIndex : undefined
      );

      state.partialStr = "";
      continue;
    }

    /* Toggle string mode */
    if (!prevContent.endsWith("\\") && token === '"')
      state.isInsideString = !state.isInsideString;
  }
};

export const parseJson = async (args: Arguments): Promise<JsonLine[]> => {
  const { from, to, file, reset } = args;

  if (reset) state = structuredClone(initialState);
  if (file) state.file = file;

  const isLastInteraction = state.bytesOffset + CHUNK_SIZE > state.file!.size;
  const isRequestedIndexOutOfBounds = to > state.rows.length;

  /* The request index is still on previous interactions range */
  if (!isRequestedIndexOutOfBounds) {
    logger.log("Got cached rows for chunk", state.currentChunkIndex);

    return state.rows.slice(from, to);
  }

  const nextChunk = (await getNextChunk())!;
  const firstChar = nextChunk[0];

  // TODO: Fix for primitives that are separated in chunks
  /* Primitive structure, return a single row and halts */
  if (reset && firstChar !== "{" && firstChar !== "[") {
    return [{ content: nextChunk, nestLevel: state.nestLevel }];
  }

  convertChunkToRows(nextChunk);

  state.currentChunkIndex++;

  /* Number of lines requested is greater than the chunk size */
  if (to > state.rows.length - 1 && !isLastInteraction) {
    return parseJson({ ...args, reset: false });
  }

  return state.rows.slice(from, to);
};
