import config from "@cyco130/eslint-config/node";
import path from "node:path";
import { fileURLToPath } from "node:url";

const tsconfigRootDir =
	// @ts-expect-error: import.meta.dirname requires v20.11.0 or v21.2.0
	import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));

/** @type {typeof config} */
export default [
	...config,
	{
		ignores: ["dist/", "node_modules/"],
	},
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir,
			},
		},
	},
];
