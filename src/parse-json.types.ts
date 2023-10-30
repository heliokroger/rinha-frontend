import type { JsonLine } from "./types";

export type State = {
  isInsideString: boolean;
  partialStr: string;
  openingBrackets: ("{" | "[")[];
  nestLevel: number;
  minNumOfRows: number;
  lines: JsonLine[];
  arrays: { currentIndex: number }[];
  file: File | null;
  bytesOffset: number;
  hasFinished: boolean;
};

export type Arguments =
  | {
      reset: false;
    }
  | {
      minNumOfRows: number;
      reset: true;
      file: File;
    };
