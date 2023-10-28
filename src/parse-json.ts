import { JsonLine } from "./types";
import Logger from "./logger";
import type { State, Arguments } from "./parse-json.types";
import { formatTime } from "./components/notifications";

const logger = new Logger("PARSE JSON WORKER");

const initialState: State = {
  openingBrackets: [],
  arrays: [],
  lines: [],
  partialStr: "",
  nestLevel: 0,
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

const convertChunkToLines = (chunk: string): JsonLine[] => {
  const lines: JsonLine[] = [];
  const tokens = chunk.trim().split("");

  const addLine = (content: string, arrayIndex?: number) => {
    const line: JsonLine = {
      content,
      nestLevel: state.nestLevel,
    };
    if (arrayIndex !== undefined) line.arrayIndex = arrayIndex;

    lines.push(line);
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

          addLine(
            state.partialStr.trim(),
            lastArray && !isKeyValuePair ? ++lastArray.currentIndex : undefined
          );

          state.arrays.push({ currentIndex: -1 });
        } else {
          addLine(
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
        addLine(
          prevContent,
          lastArray && isInsideArray ? ++lastArray.currentIndex : undefined
        );
      }

      state.nestLevel--;

      addLine(token);

      state.partialStr = "";
      continue;
    }

    if (!state.isInsideString && token === ",") {
      /* There was still content being parsed before the comma */
      if (prevContent) {
        addLine(
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

  return lines;
};

export const parseJson = async (args: Arguments): Promise<void> => {
  const { numberOfRows, file, reset } = args;

  if (reset) state = structuredClone(initialState);
  if (file) state.file = file;

  // TODO: Fix for primitives that are separated in chunks
  /* Primitive structure, return a single line and halts */
  // if (reset && firstChar !== "{" && firstChar !== "[") {
  // addRow(nextChunk);
  // return;
  // }

  let isLastInteraction = state.bytesOffset > state.file!.size;

  if (isLastInteraction) {
    logger.log("There are no more chunks");
    return;
  }

  /* Loop until rowsCount matches the requested number of lines */
  while (numberOfRows > state.lines.length - 1 && !isLastInteraction) {
    const start = performance.now();
    isLastInteraction = state.bytesOffset + CHUNK_SIZE > state.file!.size;

    const nextChunk = (await getNextChunk())!;

    const lines = convertChunkToLines(nextChunk);

    state.lines = [...state.lines, ...lines];

    logger.log(`Parsed chunk in ${formatTime(performance.now() - start)}`);
  }
};
