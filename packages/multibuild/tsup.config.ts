import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["./src/index.ts"],
		format: ["esm", "cjs"],
		platform: "node",
		target: "node16",
		dts: true,
	},
]);
