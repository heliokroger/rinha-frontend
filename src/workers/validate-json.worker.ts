import Logger from "../logger";

type State = {
  openBrackets: string[];
  isInsideString: boolean;
  isInsideNumber: boolean;
  partialSymbol: string;
  targetSymbol: string;
  numberHasMinusSign: boolean;
  isDecimalNumber: boolean;
};

const state: State = {
  openBrackets: [],
  isInsideString: false,
  isInsideNumber: false,
  numberHasMinusSign: false,
  isDecimalNumber: false,
  partialSymbol: "",
  targetSymbol: "",
};

const logger = new Logger("VALIDATE JSON WORKER");

export const CHUNK_SIZE = 1_024 * 1_000; // 1mb

const fileReader = new FileReaderSync();

const symbolsByFirstLetter = {
  f: "false",
  t: "true",
  n: "null",
};

self.onmessage = (event: MessageEvent<File>) => {
  const file = event.data;
  const start = performance.now();

  let i = 0;

  try {
    while (i <= file.size) {
      const slice = file.slice(i, i + CHUNK_SIZE);

      const chunk = fileReader.readAsText(slice);
      const tokens = chunk.split("");

      for (let j = 0; j < tokens.length; j++) {
        const token = tokens[j];
        const prevToken = tokens[j - 1];

        if (token === " ") continue;

        /* TODO: This character has special traits */
        if (token === "\\") continue;

        if (token === '"') {
          if (prevToken === "\\" && state.isInsideString) continue;

          state.isInsideString = !state.isInsideString;
        }

        if (state.partialSymbol) {
          const nextToken = state.targetSymbol[state.partialSymbol.length];

          if (token === nextToken) {
            state.partialSymbol += token;

            if (state.partialSymbol.length === state.targetSymbol.length) {
              state.partialSymbol = "";
              state.targetSymbol = "";
            }
          } else {
            throw new Error(`unexpected token ${token}`);
          }
        }

        if (!state.isInsideString) {
          switch (token) {
            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
            case "-":
            case ".":
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

              break;
            case "{":
            case "[":
              state.openBrackets.push(token);
              break;
            case "}":
            case "]": {
              const lastOpenBracket = state.openBrackets.at(-1);

              const isObjectEnd = lastOpenBracket === "{" && token === "}";
              const isArrayEnd = lastOpenBracket === "[" && token === "]";

              if (isObjectEnd || isArrayEnd) {
                state.openBrackets.pop();
                break;
              }

              throw new Error(`unexpected token ${token}`);
            }
            case ",":
              if (state.isInsideNumber) {
                state.numberHasMinusSign = false;
                state.isInsideNumber = false;
                state.isDecimalNumber = false;
              }

              if (prevToken === ",")
                throw new Error(`unexpected token ${token}`);
              break;
            case "f":
            case "t":
            case "n":
              state.targetSymbol = symbolsByFirstLetter[token];
              state.partialSymbol = token;

              break;
            case "\n":
              break;
            default:
              if (state.isInsideNumber)
                throw new Error(`unexpected token ${token}`);
          }
        }
      }

      i += CHUNK_SIZE;
    }

    if (state.openBrackets.length) throw new Error("unclosed bracket");
    if (state.isInsideString) throw new Error("unclosed quote");
    if (state.partialSymbol) throw new Error("unfinished symbol");

    self.postMessage(true);
  } catch (err) {
    self.postMessage(false);
  } finally {
    logger.log(
      `Finished validation in ${Math.round(performance.now() - start)}ms`
    );
  }
};
