import { defineConfig } from "tsup";

export default defineConfig([
	// Plugin
	{
		entry: ["./src/index.ts", "./src/cli.ts"],
		format: ["esm"],
		platform: "node",
		target: "node18",
	},
	{
		entry: ["./src/plugin.ts"],
		format: ["esm", "cjs"],
		platform: "node",
		target: "node18",
		dts: true,
	},
	{
		entry: ["./src/suppress-warnings.ts"],
		format: ["cjs"],
		platform: "node",
		target: "node18",
	},
]);
