import { JsonLine } from "./types";
import Logger from "./logger";
import type { State, Arguments } from "./parse-json.types";
import { formatTime } from "./components/notifications";

const logger = new Logger("PARSE JSON");

const initialState: State = {
  openingBrackets: [],
  arrays: [],
  lines: [],
  partialStr: "",
  nestLevel: 0,
  bytesOffset: 0,
  minNumOfRows: 0,
  isInsideString: false,
  hasFinished: false,
  file: null,
};

export let state = structuredClone(initialState);

export const CHUNK_SIZE = 1_000; // 1kb

export const clearState = () => {
  state = structuredClone(initialState);
};

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

const getChunkAndParse = async () => {
  const start = performance.now();
  state.hasFinished = state.bytesOffset + CHUNK_SIZE > state.file!.size;

  const nextChunk = (await getNextChunk())!;

  /* Primitive structure, return a single line and halts */
  if (
    state.lines.length === 0 &&
    nextChunk[0] !== "{" &&
    nextChunk[0] !== "["
  ) {
    const text = await state.file?.text();
    state.hasFinished = true;

    state.lines = [{ content: text!, nestLevel: 0 }];
  } else {
    const lines = convertChunkToLines(nextChunk);

    state.lines = [...state.lines, ...lines];
  }

  logger.log(`Parsed chunk in ${formatTime(performance.now() - start)}`);
};

export const parseJson = async (args: Arguments): Promise<void> => {
  if (args.reset) {
    clearState();

    state.file = args.file;
    state.minNumOfRows = args.minNumOfRows;
  }

  if (state.hasFinished) {
    logger.log("There are no more chunks");
    return;
  }

  if (state.lines.length === 0) {
    /* Loop until minimum number of rows is met */
    while (state.lines.length < state.minNumOfRows && !state.hasFinished) {
      await getChunkAndParse();
    }

    return;
  }

  await getChunkAndParse();
};
