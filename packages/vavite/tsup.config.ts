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
		entry: ["./src/entry.ts", "/src/middleware.ts", "./src/no-sirv.ts"],
		format: ["esm"],
		platform: "node",
		target: "node14",
		external: ["@vavite/handler"],
		shims: false,
	},
]);
