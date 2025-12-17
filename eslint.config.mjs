import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Timezone guardrails: ban direct date formatting outside timezone.ts
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: ["src/lib/timezone.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name='toLocaleString']",
          message: "Use src/lib/timezone.ts helpers instead of toLocaleString().",
        },
        {
          selector: "CallExpression[callee.property.name='toLocaleDateString']",
          message: "Use src/lib/timezone.ts helpers instead of toLocaleDateString().",
        },
        {
          selector: "CallExpression[callee.property.name='toLocaleTimeString']",
          message: "Use src/lib/timezone.ts helpers instead of toLocaleTimeString().",
        },
        {
          selector: "CallExpression[callee.object.name='Intl'][callee.property.name='DateTimeFormat']",
          message: "Use src/lib/timezone.ts helpers instead of Intl.DateTimeFormat().",
        },
      ],
    },
  },
]);

export default eslintConfig;
