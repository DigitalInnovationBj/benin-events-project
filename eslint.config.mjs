import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    // Ignorer le code généré par Prisma
    {
        ignores: [
            "prisma/**", // ton schéma et migrations
            "lib/generated/prisma/**", // si tu utilises un output personnalisé
        ],
    },
    ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
