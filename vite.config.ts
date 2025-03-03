import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { execSync } from "node:child_process";
import { dependencies } from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    define: {
        __DEBUG_INFO__: JSON.stringify({
            HEAD: execSync("git rev-parse HEAD", { encoding: "utf8" }),
            dependencies,
        }),
    },
});
