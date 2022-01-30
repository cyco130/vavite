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
		entry: ["./src/entry-standalone.ts", "./src/entry-middleware-with-sirv.ts"],
		format: ["esm"],
		platform: "node",
		target: "esnext",
		shims: false,
		external: ["@vavite/connect/handler", "@vavite/connect/user-handler"],
	},
	{
		entry: {
			"entry-middleware-with-external-sirv":
				"./src/entry-middleware-with-sirv.ts",
		},
		format: ["esm"],
		platform: "node",
		target: "esnext",
		shims: false,
		external: [
			"@vavite/connect/handler",
			"@vavite/connect/user-handler",
			"sirv",
		],
	},
]);
