import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["./src/index.ts", "./src/http-dev-server.ts"],
		format: ["esm", "cjs"],
		platform: "node",
		target: "node18",
		dts: true,
	},
]);
