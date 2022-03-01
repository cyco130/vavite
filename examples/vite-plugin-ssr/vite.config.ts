/// <reference types="vavite" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import ssr from "vite-plugin-ssr/plugin";
import vavite from "vavite";

export default defineConfig({
	buildSteps: [
		{ name: "client" },
		{
			name: "server",
			config: {
				build: {
					ssr: true,
					rollupOptions: {
						output: {
							// We have to disable this for multiple entries
							inlineDynamicImports: false,
						},
					},
				},
			},
		},
	],

	plugins: [
		vavite({
			serverEntry: "/server/index.ts",
			serveClientAssetsInDev: true,
		}),
		react(),
		ssr(),

		// The following hack is necessary because vite-plugin-import-build
		// (which is used by vite-plugin-ssr) has some deduplication logic
		// that doesn't play well with vavite's multiple builds.
		{
			name: "vite-plugin-import-build-hack",
			enforce: "post",
			closeBundle() {
				delete (global as any)["__vite-plugin-import-build:config"];
			},
		},
	],
});
