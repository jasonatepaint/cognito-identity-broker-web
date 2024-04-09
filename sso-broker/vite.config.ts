/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import viteTsConfigPaths from "vite-tsconfig-paths";

const env = loadEnv("", process.cwd());
const AUTH_API_URL = env.VITE_AUTH_API_URL;
const port = 3000;
const projectRootDir = resolve(__dirname);

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), viteTsConfigPaths(), nodePolyfills()],
    server: {
        port,
        proxy: {
            "/auth": {
                target: AUTH_API_URL,
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: "build",
        sourcemap: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                client: resolve(__dirname, "client/index.html"),
            },
        },
    },
    resolve: {
        alias: {
            crypto: "crypto-browserify",
            stream: "stream-browserify",
        },
    },
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: [resolve(projectRootDir, "tests/setup.ts")],
        coverage: {
            provider: "istanbul",
            exclude: [
                "node_modules/",
                "*.cjs",
                "tests/*.ts",
                "src/App.tsx", "src/main.tsx", "src/client.tsx"
            ],
        },
        clearMocks: true,
    },
});
