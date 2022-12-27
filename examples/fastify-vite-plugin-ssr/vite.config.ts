/// <reference types="vavite/vite-config" />

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
		ssr({ disableAutoFullBuild: true }),
	],
});
