import type { Plugin, UserConfig } from "vite";
import HashIds from "hashids";

export const generateClassName = (): Plugin => {
  const hashids = new HashIds(
    Date.now().toString(),
    3,
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  );
  const hashes = new Map();

  return {
    name: "optimize-css-modules",
    apply: "build",
    config: (): UserConfig => ({
      css: {
        modules: {
          generateScopedName: (name, filename) => {
            const key = `${name} ${filename}`;
            const existingHash = hashes.get(key);

            if (existingHash) return existingHash;

            const { size } = hashes;
            const hash = hashids.encode(size);

            hashes.set(key, hash);

            return hash;
          },
        },
      },
    }),
  };
};
