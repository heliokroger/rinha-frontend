import type { JsonLine } from "../types";

export type State = {
  isInsideString: boolean;
  partialStr: string;
  openingBrackets: ("{" | "[")[];
  nestLevel: number;
  currentChunkId: number;
  lastChunkId: number;
  rows: JsonLine[];
  arrays: { currentIndex: number }[];
  chunkInteraction: {
    [key: string]: {
      indexRange?: [number, number];
    };
  };
};

export type Arguments = {
  from: number;
  to: number;
  reset: boolean;
};
