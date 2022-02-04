import { IncomingMessage, ServerResponse } from "http";
import type {
	ConfigEnv,
	Logger,
	Plugin,
	ViteDevServer,
	UserConfig,
	SSROptions,
} from "vite";

export interface VaviteReloaderOptions {
	/**
	 * Server entry.
	 * @default "/server" which resolves to "server.js", "server.ts" etc. on the project root.
	 */
	entry?: string;

	/**
	 * When to reload the server. "any-change" reloads every time any of the dependencies of the
	 * server entry changes. "static-deps-change" only reloads when statically imported dependencies
	 * change, dynamically imported dependencies are not tracked.
	 * @default "any-change"
	 */
	reloadOn?: "any-change" | "static-deps-change";

	/** Whether to serve client-side assets in development.
	 * @default false
	 */
	serveClientAssetsInDev?: boolean;
}

export default function vaviteReloaderPlugin({
	entry = "/server",
	reloadOn = "any-change",
	serveClientAssetsInDev = false,
}: VaviteReloaderOptions = {}): Plugin {
	let resolvedEntry: string;
	let entryDeps: Set<string>;

	let logger: Logger;
	let configEnv: ConfigEnv;
	let viteServer: ViteDevServer;

	async function loadEntry() {
		logger.info("@vavite/reloader: Loading server entry");

		const resolved = await viteServer.pluginContainer.resolveId(
			entry,
			undefined,
			{
				ssr: true,
			},
		);

		if (!resolved) {
			logger.error(`@vavite/reloader: Server entry "${entry}" not found`);
			return;
		}

		resolvedEntry = resolved.id;
		await viteServer.ssrLoadModule(resolvedEntry);

		if (reloadOn === "any-change") return;

		entryDeps = new Set<string>([resolvedEntry]);

		for (const id of entryDeps) {
			const module = await viteServer.moduleGraph.getModuleById(id);
			if (!module) {
				continue;
			}

			if (!module.ssrTransformResult) {
				continue;
			}

			for (const newDep of module.ssrTransformResult.deps || []) {
				if (!newDep.startsWith("/")) {
					continue;
				}

				let newId: string;

				if (newDep.startsWith("/@id/")) {
					newId = newDep.slice(5);
				} else {
					const resolved = await viteServer.pluginContainer.resolveId(
						newDep,
						id,
						{
							ssr: true,
						},
					);

					if (!resolved) {
						continue;
					}

					newId = resolved.id;
				}

				entryDeps.add(newId);
			}
		}
	}

	return {
		name: "@vavite/reloader",

		enforce: "pre",

		resolveId(source, _importer, options) {
			if (
				source === "@vavite/reloader/dev-server" &&
				configEnv.command === "serve" &&
				options.ssr
			) {
				return "virtual:@vavite/reloader/dev-server";
			}
		},

		load(id, options) {
			if (
				id === "virtual:@vavite/reloader/dev-server" &&
				configEnv.command === "serve" &&
				options?.ssr
			) {
				if (!options?.ssr) {
					this.error(
						"'@vavite/reloader/dev-server' is only available in SSR mode",
					);
				}

				return options?.ssr
					? RUNTIME_MODULE_CONTENTS
					: RUNTIME_MODULE_CLIENT_PLACEHOLDER;
			}
		},

		config(config, env) {
			configEnv = env;

			if (typeof config.build?.ssr === "string") {
				entry = config.build.ssr;
			} else if (config.build?.ssr) {
				config.build.ssr = entry;
			}

			const out: UserConfig & { ssr: SSROptions } = {
				ssr: {
					noExternal: ["@vavite/reloader"],
				},
			};

			return out;
		},

		configResolved(config) {
			logger = config.logger;
		},

		configureServer(server) {
			viteServer = server;

			let listener:
				| ((
						req: IncomingMessage,
						res: ServerResponse,
						next: () => void,
				  ) => void)
				| undefined;

			function addMiddleware() {
				server.middlewares.use(async (req, res, next) => {
					function renderError(status: number, message: string) {
						res.statusCode = status;
						res.end(message);
					}

					if (listener) {
						req.url = req.originalUrl;
						try {
							listener(req, res, () => {
								if (!res.writableEnded) renderError(404, "Not found");
							});
						} catch (err) {
							if (err instanceof Error) {
								server.ssrFixStacktrace(err);
								return renderError(500, err.stack || err.message);
							} else {
								return renderError(500, "Unknown error");
							}
						}
					} else {
						next();
					}
				});
			}

			viteServer.httpServer?.on("listening", () => {
				(global as any).__VAVITE_DEV_SERVER = new Proxy(server.httpServer!, {
					get(target, prop) {
						if (prop === "addListener" || prop === "on") {
							return (event: string, ...rest: any) => {
								if (event === "request") {
									listener = rest[0];
								} else {
									// eslint-disable-next-line prefer-spread
									return target[prop].apply(target, [event, ...rest] as any);
								}
							};
						} else if (prop === "listen") {
							return (...args: any[]) => {
								const listener = args.find((arg) => typeof arg === "function");
								if (listener) Promise.resolve().then(listener);
							};
						}

						return (target as any)[prop];
					},
				});

				loadEntry();
			});

			if (serveClientAssetsInDev) {
				return addMiddleware;
			} else {
				addMiddleware();
			}
		},

		async handleHotUpdate(ctx) {
			if (reloadOn === "any-change") {
				await loadEntry();
				return;
			}

			if (ctx.modules.some((module) => module.id && entryDeps.has(module.id))) {
				await loadEntry();
			}
		},
	};
}

const RUNTIME_MODULE_CONTENTS = `
	const devServer = __VAVITE_DEV_SERVER;
	export default devServer;
`;

const RUNTIME_MODULE_CLIENT_PLACEHOLDER = `
	throw new Error("@vavite/reloader/dev-server is only available in SSR mode");
`;
