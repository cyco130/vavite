/// <reference types="vavite/vite-config" />

import { defineConfig } from "vite";
import vavite from "vavite";
import { swc } from "rollup-plugin-swc3";
import react from "@vitejs/plugin-react";
import ssr from "vite-plugin-ssr/plugin";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	buildSteps: [
		{
			name: "client",
		},
		{
			name: "server",
			config: {
				build: { ssr: true },
			},
		},
	],
	ssr: {
		external: ["reflect-metadata"],
	},
	esbuild: false,
	plugins: [
		{
			...swc({
				jsc: {
					transform: {
						decoratorMetadata: true,
						legacyDecorator: true,
					},
					target: "es2017",
				},
			}),
			enforce: "pre", // Make sure this is applied before anything else
		},
		vavite({
			handlerEntry: "/server/main.ts",
			serveClientAssetsInDev: true,
		}),
		react(),
		ssr({ disableAutoFullBuild: true }),
		tsconfigPaths(),
	],
});
