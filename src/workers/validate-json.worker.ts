import { validateChunk } from "../../build/release";
import Logger from "../logger";
import type { State } from "./validate-json.worker.types";

const logger = new Logger("VALIDATE JSON WORKER");

export const CHUNK_SIZE = 1_024 * 1_000; // 1mb

const fileReader = new FileReaderSync();

const symbolsByFirstLetter = {
  f: "false",
  t: "true",
  n: "null",
};

/*
  TODO:
  [] Parse objects (require key-value pairs within curly braces)
  [] Require comma after every key-value pair (except the last one)
  [] Require comma for every array item (works for false, true, null, strings, objects, arrays)
*/
self.onmessage = (event: MessageEvent<File>) => {
  const state: State = {
    openBrackets: [],
    isInsideString: false,
    isInsideNumber: false,
    numberHasMinusSign: false,
    isDecimalNumber: false,
    partialSymbol: "",
    targetSymbol: "",
    requireComma: false,
  };

  const file = event.data;
  const start = performance.now();

  let i = 0;

  try {
    while (i <= file.size) {
      const slice = file.slice(i, i + CHUNK_SIZE);

      const chunk = fileReader.readAsText(slice);

      validateChunk(chunk);

      // const tokens = chunk.split("");

      // for (let j = 0; j < tokens.length; j++) {
      //   const token = tokens[j];
      //   const prevToken = tokens[j - 1];

      //   const lastOpenBracket = state.openBrackets.at(-1);
      //   const isInsideArray = lastOpenBracket === "[";

      //   if (token === " ") continue;

      //   if (state.requireComma) {
      //     if (token !== "," && token !== "]" && token !== "}")
      //       throw new Error(`, expected, got ${token}`);

      //     state.requireComma = false;
      //   }

      //   if (token === '"') {
      //     if (prevToken === "\\" && state.isInsideString) continue;

      //     state.isInsideString = !state.isInsideString;
      //     if (!state.isInsideString && isInsideArray) state.requireComma = true;
      //   }

      //   if (state.partialSymbol) {
      //     const nextToken = state.targetSymbol[state.partialSymbol.length];

      //     if (token === nextToken) {
      //       state.partialSymbol += token;

      //       if (state.partialSymbol.length === state.targetSymbol.length) {
      //         state.partialSymbol = "";
      //         state.targetSymbol = "";

      //         if (isInsideArray) state.requireComma = true;
      //       }
      //     } else {
      //       throw new Error(`unexpected token ${token}`);
      //     }
      //   }

      //   if (!state.isInsideString) {
      //     switch (token) {
      //       case "0":
      //       case "1":
      //       case "2":
      //       case "3":
      //       case "4":
      //       case "5":
      //       case "6":
      //       case "7":
      //       case "8":
      //       case "9":
      //       case "-":
      //       case ".":
      //         if (token === "-") {
      //           if (!state.numberHasMinusSign) {
      //             state.numberHasMinusSign = true;
      //           } else {
      //             throw new Error(`unexpected token ${token}`);
      //           }
      //         }

      //         if (token === ".") {
      //           if (!state.isDecimalNumber) {
      //             state.isDecimalNumber = true;
      //           } else {
      //             throw new Error(`unexpected token ${token}`);
      //           }
      //         }

      //         if (!state.isInsideNumber) state.isInsideNumber = true;

      //         break;
      //       case "{":
      //       case "[":
      //         state.openBrackets.push(token);
      //         break;
      //       case "}":
      //       case "]": {
      //         if (prevToken === ",")
      //           throw new Error(`unexpected token ${token}`);

      //         const isObjectEnd = lastOpenBracket === "{" && token === "}";
      //         const isArrayEnd = lastOpenBracket === "[" && token === "]";

      //         if (isObjectEnd || isArrayEnd) {
      //           state.openBrackets.pop();
      //           break;
      //         }

      //         const nextOpenBracket = state.openBrackets.at(-1);
      //         if (nextOpenBracket === "[") state.requireComma = true;

      //         throw new Error(`unexpected token ${token}`);
      //       }
      //       case ",":
      //         if (state.isInsideNumber) {
      //           state.numberHasMinusSign = false;
      //           state.isInsideNumber = false;
      //           state.isDecimalNumber = false;
      //         }

      //         /*
      //           TODO: Find a way to validate previous character
      //           Examples: [1, , 3]

      //           Maybe save last char different than whitespace in the state?
      //         */
      //         break;
      //       case "f":
      //       case "t":
      //       case "n":
      //         state.targetSymbol = symbolsByFirstLetter[token];
      //         state.partialSymbol = token;

      //         break;
      //       case "\n":
      //         if (state.isInsideString)
      //           throw new Error("multiline strings are not allowed");
      //         break;
      //       default:
      //         if (state.isInsideNumber)
      //           throw new Error(`unexpected token ${token}`);
      //     }
      //   }
      // }

      i += CHUNK_SIZE;
    }

    if (state.openBrackets.length) throw new Error("unclosed bracket");
    if (state.isInsideString) throw new Error("unclosed quote");
    if (state.partialSymbol) throw new Error("unfinished symbol");

    self.postMessage(true);
  } catch (err) {
    console.error(err);
    self.postMessage(false);
  } finally {
    logger.log(
      `Finished validation in ${Math.round(performance.now() - start)}ms`
    );
  }
};
