import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
    ...nextCoreWebVitals,
    ...nextTypescript,
    {
        rules: {
            // Site francophone : échapper chaque apostrophe du JSX (&apos;)
            // nuit à la lisibilité sans bénéfice réel.
            "react/no-unescaped-entities": "off",
        },
    },
    {
        // Composants shadcn/ui vendorés : on ne les réécrit pas pour les
        // règles du React Compiler (ex. Math.random décoratif du skeleton).
        files: ["src/components/ui/**"],
        rules: {
            "react-hooks/purity": "off",
        },
    },
    globalIgnores([
        "node_modules/**",
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
    ]),
]);

export default eslintConfig;
