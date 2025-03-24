import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginImport from "eslint-plugin-import";


export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"], languageOptions: { globals: {...globals.browser, ...globals.node} } },
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"], plugins: { js, import: pluginImport }, extends: ["js/recommended"] },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    rules: {
      "no-unused-vars": "warn",
      "import/named": "error",
      "import/default": "error",
      "import/namespace": "error",
      "import/export": "error"
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  }
]);