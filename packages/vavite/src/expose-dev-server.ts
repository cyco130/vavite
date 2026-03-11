import {
	isRunnableDevEnvironment,
	type Plugin,
	type ViteDevServer,
} from "vite";
import { randomBytes } from "node:crypto";

export function exposeDevServer(): Plugin {
	// Adding a unique suffix to allows multiple Vite servers to run in the same process
	const globalSymbol = Symbol.for(
		"VAVITE_VITE_DEV_SERVER_KEY_" + randomBytes(20).toString("hex"),
	);

	let viteDevServer: ViteDevServer | undefined;

	function getModuleContents(runnable: boolean) {
		const devServer =
			runnable && viteDevServer
				? "globalThis[Symbol.for(" +
					JSON.stringify(globalSymbol.description) +
					")]"
				: "undefined";

		return `export default ${devServer}\n`;
	}

	return {
		name: "vavite:vite-dev-server",

		enforce: "pre",
		sharedDuringBuild: true,

		closeBundle() {
			delete (global as any)[globalSymbol];
		},

		configureServer(server) {
			viteDevServer = (global as any)[globalSymbol] = server;
		},

		resolveId: {
			filter: {
				id: /^vavite:vite-dev-server$/,
			},
			handler(source) {
				if (source === "vavite:vite-dev-server") {
					return "\0virtual:vavite:vite-dev-server";
				}
			},
		},

		load: {
			filter: {
				id: /^\0virtual:vavite:vite-dev-server$/,
			},
			handler(id) {
				if (id !== "\0virtual:vavite:vite-dev-server") return;

				return getModuleContents(isRunnableDevEnvironment(this.environment));
			},
		},
	} satisfies Plugin;
}
