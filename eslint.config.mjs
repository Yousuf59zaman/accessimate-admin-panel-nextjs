import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [
      "app/(admin)/**/*.tsx",
      "app/components/admin-panel/**/*.tsx",
    ],
    rules: {
      // CMS previews accept arbitrary persisted URLs and Base64 data before upload.
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "backend/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
