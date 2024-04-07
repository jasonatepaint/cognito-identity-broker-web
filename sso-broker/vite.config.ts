import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import viteTsConfigPaths from "vite-tsconfig-paths";

const env = loadEnv("", process.cwd());
const AUTH_API_URL = env.VITE_AUTH_API_URL;
const port = 3000;

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
});
