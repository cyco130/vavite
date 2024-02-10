import { IncomingMessage, ServerResponse } from "node:http";
import crypto from "node:crypto";
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

export function reloader({
	entry = "/server",
	reloadOn = "any-change",
	serveClientAssetsInDev = false,
}: VaviteReloaderOptions = {}): Plugin {
	let resolvedEntry: string;
	let entryDeps: Set<string>;
	let globalSymbol: string;

	function getModuleContents() {
		return `export default ${globalSymbol}`;
	}

	let logger: Logger;
	let configEnv: ConfigEnv;
	let viteServer: ViteDevServer;

	let resolveListenerPromise: () => void;
	const listenerPromise = new Promise<void>(
		(resolve) => (resolveListenerPromise = resolve),
	);

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

		buildStart() {
			globalSymbol =
				"VAVITE_HTTP_DEV_SERVER_" + crypto.randomBytes(20).toString("hex");
		},

		closeBundle() {
			delete (global as any)[globalSymbol];
		},

		resolveId(source) {
			if (
				source === "@vavite/reloader/http-dev-server" ||
				source === "vavite/http-dev-server" ||
				source === "virtual:vavite-http-dev-server"
			) {
				return "virtual:vavite-http-dev-server";
			}
		},

		load(id, options) {
			if (id === "virtual:vavite-http-dev-server") {
				if (!options?.ssr) {
					this.error(
						"'vavite/http-dev-server' module is only available in SSR mode",
					);
				}

				return options?.ssr && configEnv.command === "serve"
					? getModuleContents()
					: RUNTIME_MODULE_STUB;
			}
		},

		config(config, env) {
			configEnv = env;

			const out: UserConfig & { ssr: SSROptions } = {
				ssr: {
					noExternal: ["vavite"],
					optimizeDeps: {
						exclude: [
							"@vavite/reloader",
							"vavite",
							"virtual:vavite-http-dev-server",
							"vavite/http-dev-server",
						],
					},
				},
				optimizeDeps: {
					// This silences the "could not auto-determine entry point" warning
					include: [],
					exclude: [
						"@vavite/reloader",
						"vavite",
						"vavite/http-dev-server",
						"virtual:vavite-http-dev-server",
					],
				},
			};

			if (config.build?.ssr && env.command === "build") {
				return {
					...out,
					build: {
						rollupOptions: {
							input: { index: entry },
						},
					},
				};
			}

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
						next?: (error?: unknown) => void,
				  ) => void)
				| undefined;

			function addMiddleware() {
				server.middlewares.use(async (req, res, next) => {
					await listenerPromise;

					req.url = req.originalUrl;
					try {
						await listener!(req, res, (error: unknown) => {
							if (error) {
								next(error);
							} else if (!res.writableEnded) {
								next();
							}
						});
					} catch (err) {
						if (err instanceof Error) {
							server.ssrFixStacktrace(err);
						}

						next(err);
					}
				});
			}

			viteServer.httpServer?.on("listening", () => {
				(global as any)[globalSymbol] = new Proxy(server.httpServer!, {
					get(target, prop) {
						if (prop === "addListener" || prop === "on") {
							return (event: string, ...rest: any) => {
								if (event === "request") {
									listener = rest[0];
									resolveListenerPromise();
								} else {
									// eslint-disable-next-line prefer-spread
									return (target as any)[prop].apply(target, [
										event,
										...rest,
									] as any);
								}
							};
						} else if (prop === "listen") {
							return (...args: any[]) => {
								const listener = args.find((arg) => typeof arg === "function");
								// eslint-disable-next-line @typescript-eslint/no-floating-promises
								if (listener) Promise.resolve().then(listener);
								resolveListenerPromise();
							};
						}

						return (target as any)[prop];
					},
				});

				loadEntry().catch((err) => {
					logger.error("@vavite/reloader: Failed to load server entry");
					logger.error(err);
				});
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

const RUNTIME_MODULE_STUB = `export default undefined`;
