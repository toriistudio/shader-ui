import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    target: "esnext",
    external: [
      "react",
      "react-dom",
      "three",
      "three-stdlib",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
    esbuildOptions(options) {
      options.loader = {
        ...(options.loader ?? {}),
        ".glsl": "text",
        ".ttf": "dataurl",
      };
    },
  },
]);
