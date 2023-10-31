/// <reference types="vitest" />
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import { generateClassName } from "./plugins/generate-class-name";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [wasm(), generateClassName()],
  test: {
    globals: true,
  },
});
