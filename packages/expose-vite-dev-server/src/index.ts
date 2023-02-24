import type { Plugin, SSROptions, UserConfig, ViteDevServer } from "vite";
import crypto from "node:crypto";

export default function vaviteDevServerPlugin(): Plugin {
	let dev: boolean;
	let viteDevServer: ViteDevServer | undefined;
	let globalSymbol: string;

	function getModuleContents() {
		return `export default ${globalSymbol}`;
	}

	return {
		name: "@vavite/expose-vite-dev-server",

		enforce: "pre",

		buildStart() {
			globalSymbol =
				"VAVITE_VITE_DEV_SERVER_" + crypto.randomBytes(20).toString("hex");
			(global as any)[globalSymbol] = viteDevServer;
		},

		closeBundle() {
			delete (global as any)[globalSymbol];
		},

		resolveId(source, _importer, options) {
			if (
				(source === "@vavite/expose-vite-dev-server/vite-dev-server" ||
					source === "vavite/vite-dev-server") &&
				dev &&
				options.ssr
			) {
				return "virtual:vavite-vite-dev-server";
			}
		},

		load(id, options) {
			if (id === "virtual:vavite-vite-dev-server" && dev && options?.ssr) {
				return getModuleContents();
			}
		},

		config(_config, env) {
			dev = env.command === "serve";

			const out: UserConfig & { ssr: SSROptions } = {
				ssr: {
					noExternal: ["vavite"],
					optimizeDeps: {
						exclude: [
							"@vavite/expose-vite-dev-server",
							"virtual:vavite-vite-dev-server",
						],
					},
				},
				optimizeDeps: {
					exclude: [
						"@vavite/expose-vite-dev-server",
						"virtual:vavite-vite-dev-server",
					],
				},
			};

			return out;
		},

		configureServer(server) {
			viteDevServer = server;
		},
	};
}
