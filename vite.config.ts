import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import license from "rollup-plugin-license";
import { dependencies, devDependencies } from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
    base: "./",
    plugins: [
        react(),
        tailwindcss(),
        license({
            thirdParty: {
                output: "./dist/assets/vendor.LICENSE.txt",
            },
        }),
    ],
    define: {
        __HEAD__: JSON.stringify(execSync("git rev-parse HEAD", { encoding: "utf8" })),
        __DEPS__: JSON.stringify({ dependencies, devDependencies }),
    },
    worker: {
        format: "iife",
    },
    build: {
        target: ["es2022"],
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules/react-dom")) return "react";
                    if (id.includes("node_modules/react")) return "react";
                    if (id.includes("node_modules/monaco-editor")) return "monaco-editor";
                },
            },
        },
    },
    esbuild: {
        drop: ["console", "debugger"],
        banner: "/*! licenses: /assets/vendor.LICENSE.txt */",
        legalComments: "none",
    },
});
