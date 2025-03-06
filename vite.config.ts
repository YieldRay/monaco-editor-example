import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { execSync } from "node:child_process";
import { dependencies, devDependencies } from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
    base: "./",
    plugins: [react(), tailwindcss()],
    define: {
        __HEAD__: JSON.stringify(execSync("git rev-parse HEAD", { encoding: "utf8" })),
        __DEPS__: JSON.stringify({ dependencies, devDependencies }),
    },
    worker: {
        format: "es",
    },
    build: {
        target: ["es2022"],
    },
});
