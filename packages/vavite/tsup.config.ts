import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: [
			"./src/index.ts",
			"/src/middleware.ts",
			"./src/no-sirv.ts",
			"./src/entry.ts",
			"./src/stub.ts",
		],
		format: ["esm", "cjs"],
		platform: "node",
		target: "node14",
		dts: true,
		external: ["vavite/handler"],
	},
]);
