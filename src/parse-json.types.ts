import type { JsonLine } from "./types";

export type State = {
  isInsideString: boolean;
  partialStr: string;
  openingBrackets: ("{" | "[")[];
  nestLevel: number;
  lines: JsonLine[];
  arrays: { currentIndex: number }[];
  file: File | null;
  bytesOffset: number;
  lineCount: number;
};

export type Arguments = {
  numberOfRows: number;
  reset: boolean;
  file?: File;
};
