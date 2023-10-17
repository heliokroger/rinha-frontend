export const OPENING_BRACKETS = ["{", "["];
export const CLOSING_BRACKETS = ["}", "]"];

export const BRACKETS = [...OPENING_BRACKETS, ...CLOSING_BRACKETS];

export const MAX_FILE_SIZE_FOR_PARSING = 10 * 1_024 * 1_000; // 10mb
