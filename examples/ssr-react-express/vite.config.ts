/// <reference types="vavite/vite-config" />

import { defineConfig } from "vite";
import vavite from "vavite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	buildSteps: [
		{
			name: "client",
			config: {
				build: {
					outDir: "dist/client",
					manifest: true,
					rollupOptions: { input: "client-entry.tsx" },
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
		react(),
		vavite({
			serverEntry: "/server-entry.tsx",
			serveClientAssetsInDev: true,
			// Don't reload when dynamically imported dependencies change
			reloadOn: "static-deps-change",
		}),
	],
});
