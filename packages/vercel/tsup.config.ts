import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["./src/index.ts"],
		format: ["esm", "cjs"],
		platform: "node",
		target: "node14",
		dts: true,
	},
	{
		entry: ["./src/entry.ts"],
		format: ["esm"],
		platform: "node",
		target: "es2020",
		external: ["@vavite/handler"],
	},
]);
