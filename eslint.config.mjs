import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Arquitetura em camadas (constituição, seção 4; ADR-27).
// A regra compara o texto do import (estilo gitignore): cada camada
// precisa de dois padrões, um para a pasta e outro para o que está dentro dela.
const naoImportaApp = {
  group: ["**/app", "**/app/**"],
  message: "Esta camada não importa app/ (constituição, seção 4; ADR-27).",
};
const naoImportaInfra = {
  group: ["**/infra", "**/infra/**", "**/lib", "**/lib/**"],
  message: "Esta camada não importa infra/ nem lib/ (ARQ-01; ADR-27).",
};
const naoImportaBibliotecasDeInfra = {
  group: [
    "@supabase/**",
    "next",
    "next/**",
    "server-only",
    "react",
    "react/**",
    "react-dom",
    "react-dom/**",
    "node:*",
  ],
  message: "Regra de negócio não depende de biblioteca de infraestrutura (ARQ-01; ADR-27).",
};
const naoImportaCasosDeUso = {
  group: ["**/casos-de-uso", "**/casos-de-uso/**"],
  message: "Esta camada não importa casos-de-uso/ (constituição, seção 4; ADR-27).",
};
const naoImportaPortas = {
  group: ["**/portas", "**/portas/**"],
  message: "dominio/ não importa portas/ (ARQ-01; ADR-27).",
};
const restringir = (...patterns) => ({
  "no-restricted-imports": ["error", { patterns }],
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/dominio/**/*.{ts,tsx}"],
    rules: restringir(
      naoImportaApp,
      naoImportaInfra,
      naoImportaBibliotecasDeInfra,
      naoImportaCasosDeUso,
      naoImportaPortas,
    ),
  },
  {
    files: ["src/portas/**/*.{ts,tsx}"],
    rules: restringir(
      naoImportaApp,
      naoImportaInfra,
      naoImportaBibliotecasDeInfra,
      naoImportaCasosDeUso,
    ),
  },
  {
    files: ["src/casos-de-uso/**/*.{ts,tsx}"],
    rules: restringir(naoImportaApp, naoImportaInfra, naoImportaBibliotecasDeInfra),
  },
  {
    files: ["src/infra/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}"],
    rules: restringir(naoImportaApp, naoImportaCasosDeUso),
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
  ]),
]);

export default eslintConfig;
