import { defineConfig } from "tsup";

export default defineConfig([
	// Plugin
	{
		entry: ["./src/index.ts"],
		format: ["esm"],
		platform: "node",
		target: "node16",
	},
	{
		entry: ["./src/plugin.ts"],
		format: ["esm", "cjs"],
		platform: "node",
		target: "node16",
		dts: true,
	},
	{
		entry: ["./src/suppress-warnings.ts"],
		format: ["cjs"],
		platform: "node",
		target: "node16",
	},
]);
