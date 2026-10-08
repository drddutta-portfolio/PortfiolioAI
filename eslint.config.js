import eslint from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"

export default tseslint.config(
  { ignores: ["dist", "coverage", "supabase/types/database.types.ts", "supabase/functions"] },
  {
    extends: [eslint.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "api/b0-import-probe.ts",
            "api/b0-node.ts",
            "api/b0-probe.ts",
            "cloudflare/portfolioai-history-dev-api/src/index.ts",
            "scripts/p8/p8-apply-historical-crosswalk-router.ts",
            "scripts/p8/p8-apply-segment-canary-router.ts",
            "scripts/p8/p8-apply-xbrl-v3-router.ts",
            "scripts/v14-action-b-phase1-plan.ts",
            "server/b0-artifact-spool.ts",
          ],
          maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 12,
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
)
