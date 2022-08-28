import { defineConfig } from "vite";
import vavite from "vavite";
import { swc } from "rollup-plugin-swc3";

export default defineConfig({
	esbuild: false,
	plugins: [
		swc({
			jsc: {
				transform: {
					decoratorMetadata: true,
					legacyDecorator: true,
				},
				target: "es2017",
			},
		}),
		vavite({
			serverEntry: "/src/main.ts",
			serveClientAssetsInDev: true,
		}),
	],
});
