export type State = {
  openBrackets: string[];
  isInsideString: boolean;
  isInsideNumber: boolean;
  partialSymbol: string;
  targetSymbol: string;
  numberHasMinusSign: boolean;
  isDecimalNumber: boolean;
  requireComma: boolean;
};
