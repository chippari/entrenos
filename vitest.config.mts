import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Resolve o alias "@/*" -> "./src/*" definido no tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      reporter: ["text", "html"],
    },
  },
});
