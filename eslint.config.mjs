import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Bloc pour ignorer certains chemins
  {
    ignores: ["prisma/**", "lib/generated/prisma/**"],
  },

  // Bloc global pour tes règles custom
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // Bloc Next.js
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
