import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const config = [
  {
    ignores: [
      ".next/**",
      ".supabase-cli-home/**",
      "_kredibaba-source/dist/**",
      "node_modules/**",
      "lib/supabase/database.types.ts",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: [
      "components/capital/map/**/*.ts",
      "components/capital/map/**/*.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default config;
