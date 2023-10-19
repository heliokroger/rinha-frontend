const symbolsByFirstLetter = new Map<string, string>();
symbolsByFirstLetter.set("f", "false");
symbolsByFirstLetter.set("t", "true");
symbolsByFirstLetter.set("n", "null");

class State {
  constructor(
    public openBrackets: string[] = [],
    public isInsideString: boolean = false,
    public isInsideNumber: boolean = false,
    public numberHasMinusSign: boolean = false,
    public isDecimalNumber: boolean = false,
    public partialSymbol: string[] = [],
    public targetSymbol: string = "",
    public requireComma: boolean = false
  ) {}
}

const state = new State();

export function validateChunk(chunk: string): void {
  const tokens = chunk.split("");

  for (let j = 0; j < tokens.length; j++) {
    const token = tokens[j];
    const prevToken = j > 0 ? tokens[j - 1] : "";

    const lastOpenBracket = j > 0 ? state.openBrackets.at(-1) : "";
    const isInsideArray = lastOpenBracket === "[";

    if (token === " ") continue;

    if (state.requireComma) {
      if (token !== "," && token !== "]" && token !== "}")
        throw new Error(`, expected, got ${token}`);

      state.requireComma = false;
    }

    if (token === '"') {
      if (prevToken === "\\" && state.isInsideString) continue;

      state.isInsideString = !state.isInsideString;
      if (!state.isInsideString && isInsideArray) state.requireComma = true;
    }

    if (state.partialSymbol.length > 0) {
      const nextToken = state.targetSymbol.charAt(state.partialSymbol.length);

      if (token === nextToken) {
        state.partialSymbol.push(token);

        if (state.partialSymbol.length === state.targetSymbol.length) {
          state.partialSymbol = [];
          state.targetSymbol = "";

          if (isInsideArray) state.requireComma = true;
        }
      } else {
        throw new Error(`unexpected token ${token}`);
      }
    }

    if (!state.isInsideString) {
      if (
        token === "0" ||
        token === "1" ||
        token === "2" ||
        token === "3" ||
        token === "4" ||
        token === "5" ||
        token === "6" ||
        token === "7" ||
        token === "8" ||
        token === "9" ||
        token === "-" ||
        token === "."
      ) {
        if (token === "-") {
          if (!state.numberHasMinusSign) {
            state.numberHasMinusSign = true;
          } else {
            throw new Error(`unexpected token ${token}`);
          }
        }

        if (token === ".") {
          if (!state.isDecimalNumber) {
            state.isDecimalNumber = true;
          } else {
            throw new Error(`unexpected token ${token}`);
          }
        }

        if (!state.isInsideNumber) state.isInsideNumber = true;
        continue;
      }

      if (token === "{" || token === "[") {
        state.openBrackets.push(token);
        continue;
      }

      if (token === "}" || token === "]") {
        if (prevToken === ",") throw new Error(`unexpected token ${token}`);

        const isObjectEnd = lastOpenBracket === "{" && token === "}";
        const isArrayEnd = lastOpenBracket === "[" && token === "]";

        if (isObjectEnd || isArrayEnd) {
          state.openBrackets.pop();
          continue;
        }

        const nextOpenBracket = state.openBrackets.at(-1);
        if (nextOpenBracket === "[") state.requireComma = true;

        throw new Error(`unexpected token ${token}`);
      }

      if (token === ",") {
        if (state.isInsideNumber) {
          state.numberHasMinusSign = false;
          state.isInsideNumber = false;
          state.isDecimalNumber = false;
        }

        /*
          TODO: Find a way to validate previous character
          Examples: [1, , 3]

          Maybe save last char different than whitespace in the state?
        */
        continue;
      }

      if (token === "f" || token === "t" || token === "n") {
        state.targetSymbol = symbolsByFirstLetter.get(token);
        state.partialSymbol.push(token);

        continue;
      }

      if (token === "\n" && state.isInsideString) {
        throw new Error("multiline strings are not allowed");
      }

      if (state.isInsideNumber) throw new Error(`unexpected token ${token}`);
    }
  }
}
