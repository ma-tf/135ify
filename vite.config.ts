import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite-plus";

const convex = path.resolve(__dirname, "convex");
const src = path.resolve(__dirname, "src");

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    sortTailwindcss: {
      stylesheet: "./src/styles.css",
      functions: ["cn", "clsx"],
      groups: ["base", "components", "utilities", "unknown"],
      newlinesBetween: true,
    },
    sortImports: {
      printWidth: 80,
      newlinesBetween: true,
      sortSideEffects: true,
      groups: [
        "type-import",
        ["value-builtin", "value-external"],
        "type-internal",
        "value-internal",
        ["type-parent", "type-sibling", "type-index"],
        ["value-parent", "value-sibling", "value-index"],
        "side_effect_style",
        "unknown",
      ],
      order: "asc",
    },
    ignorePatterns: ["src/routeTree.gen.ts", "convex/_generated/", ".agents/"],
    overrides: [
      {
        files: ["**/*.md"],
        options: {
          printWidth: 120,
          proseWrap: "always",
        },
      },
    ],
  },
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    ignorePatterns: [".agents/"],
    options: { typeAware: true, typeCheck: true },
  },
  test: {
    environment: "jsdom",
    exclude: ["**/node_modules/**", "**/.git/**", "src/test-utils/**"],
    coverage: {
      enabled: true,
      exclude: ["src/components/ui/**"],
      reporter: ["lcov", "text", "json"],
    },
  },
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": src,
      "@convex": convex,
      "@config": `${src}/config`,
      "@routes": `${src}/routes`,
      "@components": `${src}/components`,
      "@utils": `${src}/lib/utils`,
      "@ui": `${src}/components/ui`,
      "@lib": `${src}/lib`,
      "@hooks": `${src}/hooks`,
      "@features": `${src}/features`,
      "@stores": `${src}/stores`,
      "@providers": `${src}/providers`,
      "@test-utils": `${src}/test-utils`,
    },
  },
});
