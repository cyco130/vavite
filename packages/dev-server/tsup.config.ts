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
		entry: ["./src/server.ts"],
		format: ["esm"],
		platform: "node",
		target: "node14",
	},
]);
