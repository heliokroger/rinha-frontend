import ParseJsonWorker from "./parse-json.worker?worker";
import ValidateJsonWorker from "./validate-json.worker?worker";

export const parseJsonWorker = new ParseJsonWorker();
export const validateJsonWorker = new ValidateJsonWorker();
