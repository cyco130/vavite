import { defineConfig } from "tsup";

export default defineConfig([
	// Plugin
	{
		entry: ["./src/index.ts"],
		format: ["esm"],
		platform: "node",
		target: "node18",
		dts: true,
	},
	// Standalone entry
	{
		entry: {
			"entry-standalone": "./src/entry-standalone.ts",
			"entry-standalone-imported-sirv": "./src/entry-standalone-with-sirv.ts",
		},
		format: ["esm"],
		platform: "node",
		target: "esnext",
		shims: false,
		external: ["sirv", "/virtual:vavite-connect-handler"],
	},
	{
		entry: {
			"entry-standalone-bundled-sirv": "./src/entry-standalone-with-sirv.ts",
		},
		format: ["esm"],
		platform: "node",
		target: "esnext",
		shims: false,
		external: ["/virtual:vavite-connect-handler"],
		noExternal: ["sirv"],
	},
]);
