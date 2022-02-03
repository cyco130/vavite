import type { Plugin } from "vite";

export default function vaviteDevServerMethodsPlugin(): Plugin {
	let dev: boolean;

	return {
		name: "@vavite/dev-server-methods",

		enforce: "pre",

		resolveId(source, _importer, options) {
			if (source === "@vavite/dev-server-methods" && dev && options.ssr) {
				return "virtual:@vavite/dev-server-methods";
			}
		},

		load(id, options) {
			if (id === "virtual:@vavite/dev-server-methods" && dev && options?.ssr) {
				return MODULE_CONTENTS;
			}
		},

		config(_config, env) {
			dev = env.command === "serve";
		},

		configureServer(server) {
			(global as any).__VITE_DEV_SERVER = server;
		},
	};
}

const MODULE_CONTENTS = `
	export const transformIndexHtml = (url, html, originalUrl) => __VITE_DEV_SERVER.transformIndexHtml(url, html, originalUrl);
	export const fixStacktrace = (error) => __VITE_DEV_SERVER.ssrFixStacktrace(error);
`;
