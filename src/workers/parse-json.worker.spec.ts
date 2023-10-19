import ParseJsonWorker from "./parse-json.worker?worker";

const worker = new ParseJsonWorker();

const readAsText = vi.fn().mockReturnValue('"hello"');

beforeAll(() => {
  vi.stubGlobal(
    "FileReaderSync",
    vi.fn(() => ({
      readAsText,
    }))
  );
});

describe("testing parse json worker", () => {
  describe("testing processChunk", () => {
    it.only("should be able to parse primitive structures", async () => {
      const file = { size: 100, slice: vi.fn() };

      worker.postMessage({ reset: true, file });

      const data = await new Promise((resolve) => {
        worker.onmessage = (event) => {
          resolve(event.data);
        };
      });

      expect(data).toEqual([{ content: '"hello"', nestLevel: 0 }]);
    });

    // it("should separate brackets in rows", async () => {
    //   const json = { id: 1, chunk: `{"test": {"test": []}}` };

    //   first.mockResolvedValue(json);
    //   last.mockResolvedValue(json);

    //   worker.postMessage({ reset: true });

    //   const data = await new Promise((resolve) => {
    //     worker.onmessage = (event) => {
    //       resolve(event.data);
    //     };
    //   });

    //   expect(data).toEqual([
    //     { content: "{", nestLevel: 0 },
    //     { content: '"test":{', nestLevel: 1 },
    //     { content: '"test":[', nestLevel: 2 },
    //     { content: "]", nestLevel: 2 },
    //     { content: "}", nestLevel: 1 },
    //     { content: "}", nestLevel: 0 },
    //   ]);
    // });

    // it("should be able to keep commas in structures that are comma separated", async () => {
    //   const json = { id: 1, chunk: `{"array": [1,2,"string"]}` };

    //   first.mockResolvedValue(json);
    //   last.mockResolvedValue(json);

    //   worker.postMessage({ reset: true });

    //   const data = await new Promise((resolve) => {
    //     worker.onmessage = (event) => {
    //       resolve(event.data);
    //     };
    //   });

    //   expect(data).toEqual([
    //     { content: "{", nestLevel: 0 },
    //     { content: '"array":[', nestLevel: 1 },
    //     { content: "1,", nestLevel: 2, arrayIndex: 0 },
    //     { content: "2,", nestLevel: 2, arrayIndex: 1 },
    //     { content: '"string"', nestLevel: 2, arrayIndex: 2 },
    //     { content: "]", nestLevel: 1 },
    //     { content: "}", nestLevel: 0 },
    //   ]);
    // });

    // it("should be able to put commas after brackets in the same row", async () => {
    //   first.mockResolvedValue({ id: 1, chunk: `{"array": [[],[]]}` });
    //   worker.postMessage({ reset: true });

    //   const data = await new Promise((resolve) => {
    //     worker.onmessage = (event) => {
    //       resolve(event.data);
    //     };
    //   });

    //   expect(data).toEqual([
    //     { content: "{", nestLevel: 0 },
    //     { content: '"array":[', nestLevel: 1 },
    //     { content: "[", nestLevel: 2, arrayIndex: 0 },
    //     { content: "],", nestLevel: 2 },
    //     { content: "[", nestLevel: 2, arrayIndex: 1 },
    //     { content: "]", nestLevel: 2 },
    //     { content: "]", nestLevel: 1 },
    //     { content: "}", nestLevel: 0 },
    //   ]);
    // });

    // it("should be able to separate multiline json", async () => {
    //   const json = {
    //     id: 1,
    //     chunk: `[
    //       [
    //         "Thursday",
    //         "6:30AM–6PM"
    //       ]
    //     ]`,
    //   };

    //   first.mockResolvedValue(json);
    //   last.mockResolvedValue(json);

    //   worker.postMessage({ reset: true });

    //   const data = await new Promise((resolve) => {
    //     worker.onmessage = (event) => {
    //       resolve(event.data);
    //     };
    //   });

    //   expect(data).toEqual([
    //     { content: "[", nestLevel: 0 },
    //     { content: "[", nestLevel: 1, arrayIndex: 0 },
    //     { content: '"Thursday",', nestLevel: 2, arrayIndex: 0 },
    //     { content: '"6:30AM–6PM"', nestLevel: 2, arrayIndex: 1 },
    //     { content: "]", nestLevel: 1 },
    //     { content: "]", nestLevel: 0 },
    //   ]);
    // });

    // it("should be able to get rows from two or more chunks at once", async () => {
    //   const firstChunk = {
    //     id: 1,
    //     chunk: `[
    //       [
    //         "Thursday",
    //         `,
    //   };

    //   const lastChunk = {
    //     id: 2,
    //     chunk: `"6:30AM–6PM"
    //       ]
    //     ]`,
    //   };

    //   first.mockResolvedValue(firstChunk);
    //   get.mockResolvedValue(lastChunk);
    //   last.mockResolvedValue(lastChunk);

    //   worker.postMessage({ reset: true, from: 0, to: 6 });

    //   const data = await new Promise((resolve) => {
    //     worker.onmessage = (event) => {
    //       resolve(event.data);
    //     };
    //   });

    //   expect(data).toEqual([
    //     { content: "[", nestLevel: 0 },
    //     { content: "[", nestLevel: 1, arrayIndex: 0 },
    //     { content: '"Thursday",', nestLevel: 2, arrayIndex: 0 },
    //     { content: '"6:30AM–6PM"', nestLevel: 2, arrayIndex: 1 },
    //     { content: "]", nestLevel: 1 },
    //     { content: "]", nestLevel: 0 },
    //   ]);
    // });
  });
});
