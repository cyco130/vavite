/// <reference types="vavite" />

import { defineConfig } from "vite";
import vavite from "vavite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
	buildSteps: [
		{
			name: "client",
			config: {
				build: {
					outDir: "dist/client",
					manifest: true,
					rollupOptions: { input: "client-entry.ts" },
				},
			},
		},
		{
			name: "server",
			config: {
				build: {
					ssr: true,
					outDir: "dist/server",
				},
			},
		},
	],

	plugins: [
		vue(),
		vavite({
			serverEntry: "/server-entry.ts",
			serveClientAssetsInDev: true,
			// Don't reload when dynamically imported dependencies change
			reloadOn: "static-deps-change",
		}),
	],
});
