import { defineConfig } from "vite";
import vavite from "vavite";
import { swc } from "rollup-plugin-swc3";

export default defineConfig({
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
					target: "es2021",
				},
			}),
			enforce: "pre", // Make sure this is applied before anything else
		},
		vavite({
			handlerEntry: "/src/main.ts",
			serveClientAssetsInDev: true,
		}),
	],
});
