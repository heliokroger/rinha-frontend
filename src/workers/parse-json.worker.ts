import { BRACKETS, CLOSING_BRACKETS, OPENING_BRACKETS } from "../constants";
import db, { Table } from "../db";
import { JsonLine } from "../types";
import Logger from "./logger";
import type { State, Arguments } from "./parse-json.worker.types";

const logger = new Logger("PARSE JSON WORKER");

const initialState: State = {
  isInsideString: false,
  openingBrackets: [],
  partialStr: "",
  nestLevel: 0,
  currentChunkId: 0,
  lastChunkId: null,
  arrays: [],
  rows: [],
  chunkInteraction: {},
};

let state = structuredClone(initialState);

const getLastChunk = async () => db.table(Table.Chunks).toCollection().last();

const deleteChunk = (id: number) => {
  db.table(Table.Chunks)
    .delete(id)
    .then(() => {
      logger.log("Deleted chunk", id);
    });
};

const getNextChunk = async () => {
  if (state.currentChunkId === 0) {
    return db.table(Table.Chunks).toCollection().first();
  }

  return db.table(Table.Chunks).get(state.currentChunkId);
};

const FIRST_CHUNK_ID = 1;

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
    if (!state.isInsideString && BRACKETS.includes(token)) {
      /* New block, increases nest level */
      if (OPENING_BRACKETS.includes(token)) {
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
      if (CLOSING_BRACKETS.includes(prevRow.content)) {
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

  return state.rows;
};

const onMessage = async (event: MessageEvent<Arguments>) => {
  const { from, to, reset, content } = event.data;

  if (reset) state = structuredClone(initialState);

  const previousInteraction = state.chunkInteraction[state.currentChunkId];

  const isRequestedIndexOutOfBounds = to > previousInteraction?.indexRange![1];

  /* Needs to request and parse a new chunk */
  if (previousInteraction && isRequestedIndexOutOfBounds) {
    logger.log("New chunk requested");

    const chunk = await getLastChunk();

    if (chunk) {
      state.lastChunkId = chunk.id;

      const isLastInteraction = state.currentChunkId === state.lastChunkId;

      if (!isLastInteraction) {
        state.currentChunkId++;
        const nextChunk = await getNextChunk();

        convertChunkToRows(nextChunk.chunk);
        state.chunkInteraction[state.currentChunkId] = {
          ...state.chunkInteraction[state.currentChunkId],
          indexRange: [
            previousInteraction.indexRange![1],
            state.rows.length - 1,
          ],
        };

        deleteChunk(nextChunk.id);

        self.postMessage(state.rows.slice(from, to));
        return;
      }
    }
  }

  /* The request index is still on previous interactions range */
  if (previousInteraction) {
    logger.log("Got cached rows for chunk", state.currentChunkId);

    self.postMessage(state.rows.slice(from, to));
    return;
  }

  if (!content)
    throw new Error("content is required for first parser interaction");

  /* Primitive structure, return a single row and halts */
  if (
    !from &&
    !OPENING_BRACKETS.some((bracket) => content.startsWith(bracket))
  ) {
    self.postMessage([{ content, nestLevel: state.nestLevel }]);
    return;
  }

  const rows = convertChunkToRows(content);

  state.currentChunkId = FIRST_CHUNK_ID;

  /* Caches the line range present in the chunk */
  state.chunkInteraction[state.currentChunkId] = {
    ...state.chunkInteraction[state.currentChunkId],
    indexRange: [from, rows.length - 1],
  };

  /* Might not have the id already */
  deleteChunk(FIRST_CHUNK_ID);

  /* The first slice request requires more than one interaction */
  // if (to > state.rows.length - 1 && !isLastInteraction) {
  //   onMessage({ ...event, data: { ...event.data, reset: false } });
  //   return;
  // }

  self.postMessage(state.rows.slice(from, to));
};

self.onmessage = onMessage;
