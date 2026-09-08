import eslint from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
  {ignores:["supabase/types/database.types.ts"]},
  {
    files:["supabase/functions/**/*.ts"],
    extends:[eslint.configs.recommended,...tseslint.configs.recommended],
    languageOptions:{ecmaVersion:2023,globals:{...globals.browser,Deno:"readonly"}},
  },
)
