import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const config = [
  {
    ignores: [
      ".next/**",
      ".next-dev/**",
      ".supabase-cli-home/**",
      "_kredibaba-source/**",
      "node_modules/**",
      "lib/supabase/database.types.ts",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: [
      "components/equity-market/map/**/*.ts",
      "components/equity-market/map/**/*.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default config;
