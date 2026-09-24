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
];

export default config;
