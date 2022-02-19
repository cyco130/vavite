import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["./src/index.ts", "./src/http-dev-server.ts"],
		format: ["esm", "cjs"],
		platform: "node",
		target: "node14",
		dts: {
			entry: "./src/index.ts",
		},
	},
]);
