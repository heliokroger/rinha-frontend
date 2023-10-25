import type { JsonLine } from "./types";

export type State = {
  isInsideString: boolean;
  partialStr: string;
  openingBrackets: ("{" | "[")[];
  nestLevel: number;
  rows: JsonLine[];
  arrays: { currentIndex: number }[];
  file: File | null;
  bytesOffset: number;
  rowsCount: number;
};

export type Arguments = {
  from: number;
  to: number;
  reset: boolean;
  file?: File;
};
