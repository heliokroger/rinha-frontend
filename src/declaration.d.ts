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

declare class Go {
  argv: string[];
  env: { [envKey: string]: string };
  exit: (code: number) => void;
  importObject: WebAssembly.Imports;
  exited: boolean;
  mem: DataView;
  run(instance: WebAssembly.Instance): Promise<void>;
}

declare function validateJson(file: string): boolean;
