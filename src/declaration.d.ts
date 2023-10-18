interface FileReaderSync {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readAsArrayBuffer(blob: Blob): any;
  readAsBinaryString(blob: Blob): string;
  readAsDataURL(blob: Blob): string;
  readAsText(blob: Blob, encoding?: string): string;
}

declare const FileReaderSync: {
  prototype: FileReaderSync;
  new (): FileReaderSync;
};
