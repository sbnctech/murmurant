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
  // ═══════════════════════════════════════════════════════════════════════════
  // REGRESSION GUARD: Server components must not fetch from /api/admin/*
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // WHY: Server Components cannot propagate auth headers/cookies to internal
  // API routes. Fetching /api/admin/* from a Server Component will fail with
  // "Unauthorized" because the request lacks authentication context.
  //
  // FIX: Use Prisma queries directly or import from src/server/admin/*.
  //
  // SCOPE: Only applies to Next.js App Router Server Component files:
  //   - page.tsx, layout.tsx, loading.tsx, error.tsx, not-found.tsx
  //
  // ESCAPE HATCH: If you have a legitimate reason to fetch /api/admin/* from
  // a server component (e.g., forwarding auth explicitly), disable per-line:
  //   // eslint-disable-next-line no-restricted-syntax -- ALLOW_API_ADMIN_FETCH: <reason>
  // ═══════════════════════════════════════════════════════════════════════════
  {
    files: [
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/app/**/loading.tsx",
      "src/app/**/error.tsx",
      "src/app/**/not-found.tsx",
    ],
    ignores: [
      "src/app/api/**",
      "src/pages/**",
      "src/**/*.test.*",
      "src/**/*.spec.*",
      // TODO: These pages have the same bug (fetching /api/admin/*) and need to be
      // migrated to use Prisma queries directly. Tracked for later cleanup.
      "src/app/admin/page.tsx",
      "src/app/admin/members/*/page.tsx",
      "src/app/admin/registrations/*/page.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          // Pattern 1: fetch("/api/admin/...") - string literal
          selector:
            'CallExpression[callee.name="fetch"] Literal[value=/api.*admin/]',
          message:
            "Server components must not fetch from /api/admin/*. " +
            "Auth headers do not propagate. Use Prisma queries directly " +
            "or import from src/server/admin/*. " +
            "Escape: // eslint-disable-next-line no-restricted-syntax -- ALLOW_API_ADMIN_FETCH: <reason>",
        },
        {
          // Pattern 2: fetch(`${base}/api/admin/...`) - template literal
          selector:
            'CallExpression[callee.name="fetch"] TemplateElement[value.raw=/api.*admin/]',
          message:
            "Server components must not fetch from /api/admin/*. " +
            "Auth headers do not propagate. Use Prisma queries directly " +
            "or import from src/server/admin/*. " +
            "Escape: // eslint-disable-next-line no-restricted-syntax -- ALLOW_API_ADMIN_FETCH: <reason>",
        },
        {
          // Pattern 3: fetch(new URL("/api/admin/...", base)) - URL constructor
          selector:
            'CallExpression[callee.name="fetch"] NewExpression[callee.name="URL"] Literal[value=/api.*admin/]',
          message:
            "Server components must not fetch from /api/admin/*. " +
            "Auth headers do not propagate. Use Prisma queries directly " +
            "or import from src/server/admin/*. " +
            "Escape: // eslint-disable-next-line no-restricted-syntax -- ALLOW_API_ADMIN_FETCH: <reason>",
        },
      ],
    },
  },
]);

export default eslintConfig;
