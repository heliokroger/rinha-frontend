import ValidateJsonWorker from "./validate-json.worker?worker";

export const createValidateJsonWorker = () => new ValidateJsonWorker();
