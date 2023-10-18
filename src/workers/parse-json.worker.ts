import { BRACKETS, CLOSING_BRACKETS, OPENING_BRACKETS } from "../constants";
import { JsonLine } from "../types";
import Logger from "../logger";
import type { State, Arguments } from "./parse-json.worker.types";

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
  chunkInteraction: {},
  file: null,
};

let state = structuredClone(initialState);

export const CHUNK_SIZE = 1_000; // 1kb

const fileReader = new FileReaderSync();

const getNextChunk = () => {
  if (state.file) {
    const blob = state.file.slice(
      state.bytesOffset,
      state.bytesOffset + CHUNK_SIZE
    );

    state.bytesOffset += CHUNK_SIZE;

    return fileReader.readAsText(blob);
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
    if (!state.isInsideString && BRACKETS.has(token)) {
      /* New block, increases nest level */
      if (OPENING_BRACKETS.has(token)) {
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
      if (CLOSING_BRACKETS.has(prevRow.content)) {
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

const onMessage = async (args: Arguments) => {
  const { from, to, file, reset } = args;

  if (reset) state = structuredClone(initialState);
  if (file) state.file = file;

  const previousInteraction = state.chunkInteraction[state.currentChunkIndex];
  const isLastInteraction = state.bytesOffset + CHUNK_SIZE > state.file!.size;
  const isRequestedIndexOutOfBounds = to > previousInteraction?.indexRange![1];

  /* The request index is still on previous interactions range */
  if (previousInteraction && !isRequestedIndexOutOfBounds) {
    logger.log("Got cached rows for chunk", state.currentChunkIndex);

    self.postMessage(state.rows.slice(from, to));
    return;
  }

  const nextChunk = getNextChunk()!;
  const firstChar = nextChunk[0];

  /* Primitive structure, return a single row and halts */
  if (reset && !OPENING_BRACKETS.has(firstChar)) {
    self.postMessage([{ content: nextChunk, nestLevel: state.nestLevel }]);
    return;
  }

  convertChunkToRows(nextChunk);

  /* Caches the line range present in the chunk */
  state.chunkInteraction[state.currentChunkIndex] = {
    ...state.chunkInteraction[state.currentChunkIndex],
    indexRange: [
      previousInteraction?.indexRange?.[1] ?? 0,
      state.rows.length - 1,
    ],
  };

  state.currentChunkIndex++;

  /* Number of lines requested is greater than the chunk size */
  if (to > state.rows.length - 1 && !isLastInteraction) {
    onMessage({ ...args, reset: false });
    return;
  }

  self.postMessage(state.rows.slice(from, to));
};

self.onmessage = (event: MessageEvent<Arguments>) => onMessage(event.data);
