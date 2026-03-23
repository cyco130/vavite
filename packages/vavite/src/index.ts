import {
	isRunnableDevEnvironment,
	type ConfigPluginContext,
	type Connect,
	type Plugin,
} from "vite";
import { exposeEnvironment as exposeEnvironmentPlugin } from "./expose-environment";
import { exposeDevServer as exposeDevServerPlugin } from "./expose-dev-server";
import { basename } from "node:path";
import { createProxy, type ServerOptions as ProxyOptions } from "http-proxy-3";

export interface VaviteOptions {
	/**
	 * The entries to register.
	 *
	 * @default [{ environment: "ssr", entry: "/src/entry.server", exportName: "default" }]
	 */
	entries?: VaviteEntry[];
	/**
	 * Whether to expose the current environment and command as `import.meta.env.ENVIRONMENT`
	 * and `import.meta.env.COMMAND`. This is useful for conditionally running code based on the
	 * environment or command. For example, you can check `import.meta.env.COMMAND === "serve"`
	 * to run code only in development mode.
	 *
	 * @default true
	 */
	exposeEnvironment?: boolean;
	/**
	 * Whether to expose the Vite dev server in development mode. This allows you to access the dev
	 * server instance in your handler entries and use its features, such as `transformIndexHtml`.
	 *
	 * @default true
	 */
	exposeDevServer?: boolean;
}

export type VaviteEntry =
	| VaviteRunnableHandlerEntry
	| VaviteRunnableServerEntry;

export interface VaviteRunnableHandlerEntry {
	type?: "runnable-handler";
	/**
	 * The name of the environment to load the handler entry from. The environment must be defined
	 * in the Vite config and must be a runnable environment.
	 *
	 * @default "ssr"
	 */
	environment?: string;
	/**
	 * The path to the module exporting the handler function. Start with "/" for entries within the
	 * project root or specify a bare import like "my-package/handler" for entries from dependencies.
	 */
	entry: string;
	/**
	 * Name of the export to use as the handler function.
	 *
	 * @default "default"
	 */
	exportName?: string;
	/**
	 * Whether to register the middleware before or after Vite's own middlewares. If not specified,
	 * Vavite will try to automatically determine the order based on whether a client entry is in
	 * the config.
	 */
	order?: "pre" | "post";
	/**
	 * Whether the handler is final and should not call `next()` to pass to the next middleware. If
	 * set to true, Vavite will not pass the `next` function to the handler and the handler is
	 * expected to end the response.\
	 *
	 * @default true for the last entry, false for the others
	 */
	final?: boolean;
	/**
	 * Whether to add the entry to the Rollup input options. This is usually what you want.
	 *
	 * @default true
	 */
	addEntryToInputOptions?: boolean | string;
}

export interface VaviteRunnableServerEntry {
	type: "runnable-server";
	/**
	 * The name of the environment to load the handler entry from. The environment must be defined
	 * in the Vite config and must be a runnable environment.
	 *
	 * @default "ssr"
	 */
	environment?: string;
	/**
	 * The path to the module exporting the server module. Start with "/" for entries within the
	 * project root or specify a bare import like "my-package/server" for entries from dependencies.
	 */
	entry: string;
	/**
	 * The options for the proxy middleware that forwards requests to the server. At least one of
	 * the `target` option must be specified to indicate where to proxy the requests.
	 *
	 * @see https://github.com/sagemathinc/http-proxy-3#options
	 */
	proxyOptions: ProxyOptions;
	/**
	 * Whether to register the proxy before or after Vite's own middlewares. If not specified,
	 * Vavite will try to automatically determine the order based on whether a client entry is in
	 * the config.
	 */
	order?: "pre" | "post";
	/**
	 * @experimental
	 *
	 * Whether the server can decide not to handle a request and pass it to the next middleware by
	 * responding with a 404 status code and a `Vavite-Try-Next-Upstream` header set to `true`. This is
	 * useful for implementing features like API routes where some requests should be handled by
	 * the server and others should be passed to the next middleware (e.g. Vite's static file
	 * serving).
	 *
	 * If set to false, some proxy features like cookie rewriting and header case preservation
	 * won't work.
	 *
	 * @default true
	 */
	final?: boolean;
	/**
	 * Whether to add the entry to the Rollup input options. This is usually what you want.
	 *
	 * @default true
	 */
	addEntryToInputOptions?: boolean | string;
}

export type { ProxyOptions };

export function vavite(options: VaviteOptions = {}): Plugin[] {
	const {
		entries = [{ environment: "ssr", entry: "/src/entry.server" }],
		exposeEnvironment = true,
		exposeDevServer = true,
	} = options;

	let defaultMiddlewareOrder: "pre" | "post" = "post";

	const middlewarePlugin: Plugin = {
		name: "vavite",

		config: {
			order: "post",
			handler(config) {
				const inputs = new Map<string, Map<string, string | null>>();

				const hasRoldown = this.meta.rolldownVersion !== undefined;
				const optionsKey = hasRoldown
					? ("rolldownOptions" as const)
					: ("rollupOptions" as const);

				for (const entry of entries) {
					const {
						environment: environmentName = "ssr",
						entry: entryPath = "/src/entry.server",
						addEntryToInputOptions = true,
					} = entry;

					if (addEntryToInputOptions) {
						if (!inputs.has(environmentName)) {
							inputs.set(environmentName, new Map());
						}

						inputs
							.get(environmentName)!
							.set(
								entryPath,
								typeof addEntryToInputOptions === "string"
									? addEntryToInputOptions
									: null,
							);
					}
				}

				for (const [environmentName, entries] of inputs) {
					config.environments ??= {};
					config.environments[environmentName] ??= {};
					config.environments[environmentName].build ??= {};
					config.environments[environmentName].build[optionsKey] ??= {};
					config.environments[environmentName].build[optionsKey].input ??= {};

					const normalizedInput = addToRollupInput(
						config.environments[environmentName].build[optionsKey].input,
						entries,
						this.warn,
					);

					config.environments[environmentName].build[optionsKey].input =
						normalizedInput;
				}
			},
		},

		configResolved(config) {
			const hasRoldown = this.meta.rolldownVersion !== undefined;
			const optionsKey = hasRoldown
				? ("rolldownOptions" as const)
				: ("rollupOptions" as const);

			// Try to determine whether to register the middleware before or after Vite's own
			// middlewares based on whether a client entry is explicitly defined in the config.

			const input =
				config.build[optionsKey].input ??
				config.environments.client?.build[optionsKey].input;

			if (!input) {
				defaultMiddlewareOrder = "pre";
				return;
			}

			if (
				typeof input === "string" ||
				(Array.isArray(input) && input.length > 0) ||
				Object.keys(input).length > 0
			) {
				defaultMiddlewareOrder = "post";
			}
		},

		async configureServer(server) {
			const sortedEntries = entries
				.map((entry) => ({
					...entry,
					order: entry.order ?? defaultMiddlewareOrder,
				}))
				.sort((a, b) => {
					if (a.order === b.order) {
						return 0;
					}

					return a.order === "pre" ? -1 : 1;
				});

			const postMiddlewares: Connect.NextHandleFunction[] = [];

			for (const [index, entry] of sortedEntries.entries()) {
				const {
					environment: environmentName = "ssr",
					entry: entryPath,
					final = index === sortedEntries.length - 1,
					order = defaultMiddlewareOrder,
				} = entry;

				if (final && index !== sortedEntries.length - 1) {
					this.warn(
						`Entry ${JSON.stringify(
							entryPath,
						)} is marked as final but it's not the last entry in the chain. This might lead to unexpected behavior.`,
					);
				}

				const environment = server.environments[environmentName];

				if (!environment) {
					return this.error(
						`[vavite] Non-existing environment ${JSON.stringify(environmentName)}`,
					);
				}

				if (!isRunnableDevEnvironment(environment)) {
					return this.error(
						`[vavite] Environment ${JSON.stringify(environmentName)} is not runnable and cannot be used as an entry`,
					);
				}

				const quotedEnvironmentName = JSON.stringify(environmentName);

				let vaviteMiddleware: Connect.NextHandleFunction;

				if (entry.type === "runnable-handler" || entry.type === undefined) {
					const { exportName = "default" } = entry;

					const vaviteRunnableHandlerMiddleware: Connect.NextHandleFunction =
						async (req, res, next) => {
							const quotedEntry = JSON.stringify(entryPath);
							try {
								const module = await environment.runner.import(entryPath);
								const imported = module[exportName];
								if (typeof imported !== "function") {
									throw new Error(
										`[vavite] ${quotedEnvironmentName} environment entry ${quotedEntry} doesn't export a function as ${JSON.stringify(exportName)}`,
									);
								}

								const handler = imported;

								if (final) {
									await handler(req, res);
								} else {
									await handler(req, res, next);
								}
							} catch (error) {
								next(error);
							}
						};

					vaviteMiddleware = vaviteRunnableHandlerMiddleware;
				} else if (entry.type === "runnable-server") {
					// Load the server module early
					await environment.runner.import(entryPath).catch(() => {});

					const { proxyOptions } = entry;

					const proxy = createProxy(
						final
							? proxyOptions
							: {
									...proxyOptions,
									selfHandleResponse: true,
								},
					);

					if (!final) {
						proxy.on("proxyRes", (proxyRes, req, res) => {
							if (
								proxyRes.statusCode === 404 &&
								proxyRes.headers["vavite-try-next-upstream"] === "true"
							) {
								proxyRes.destroy();
								(req as any).vaviteNextUpstream();
								return;
							}

							res.statusCode = proxyRes.statusCode ?? 200;
							for (const [key, value] of Object.entries(proxyRes.headers)) {
								if (value !== undefined) {
									res.setHeader(key, value);
								}
							}
							proxyRes.pipe(res);
						});
					}

					const vaviteRunnableServerMiddleware: Connect.NextHandleFunction =
						async (req, res, next) => {
							try {
								// Try to reload the server module in case of previous errors
								await environment.runner.import(entryPath);

								// Pass to correct proxy (websocket or http) based on the request
								if (
									proxyOptions.ws &&
									req.headers.upgrade &&
									req.headers.upgrade.toLowerCase() === "websocket"
								) {
									(req as any).vaviteNextUpstream = next;
									proxy.ws(req, res, next);
								} else {
									(req as any).vaviteNextUpstream = next;
									proxy.web(req, res, next);
								}
							} catch (error) {
								next(error);
							}
						};

					vaviteMiddleware = vaviteRunnableServerMiddleware;
				} else {
					return this.error(
						`[vavite]: Unknown entry type: ${JSON.stringify(entry.type)}`,
					);
				}

				if (order === "post") {
					postMiddlewares.push(vaviteMiddleware);
				} else {
					server.middlewares.use(vaviteMiddleware);
				}

				continue;
			}

			if (postMiddlewares.length) {
				return () => {
					for (const middleware of postMiddlewares) {
						server.middlewares.use(middleware);
					}
				};
			}
		},
	};

	const plugins = [middlewarePlugin];

	if (exposeEnvironment) {
		plugins.push(exposeEnvironmentPlugin());
	}

	if (exposeDevServer) {
		plugins.push(exposeDevServerPlugin());
	}

	return plugins;
}

function addToRollupInput(
	input: string | string[] | Record<string, string>,
	entries: Map<string, string | null>,
	warn: ConfigPluginContext["warn"],
): Record<string, string> {
	if (typeof input === "string") {
		warn(
			`Rollup input is a string. It has been converted to an object to add the entries ${JSON.stringify(
				Array.from(entries.keys()),
			)}.`,
		);
		input = [input];
	}

	let result: Record<string, string>;
	if (Array.isArray(input)) {
		warn(
			`Rollup input is an array. It has been converted to an object to add the entries ${JSON.stringify(
				Array.from(entries.keys()),
			)}.`,
		);
		result = {};
		for (const entry of input) {
			let key = simplifyEntryName(entry);
			let counter = 1;
			while (key in result) {
				key = `${key}${counter++}`;
			}

			result[key] = entry;
		}
	} else {
		result = input;
	}

	for (const [entryPath, key] of entries) {
		let name = key ?? simplifyEntryName(entryPath);
		let counter = 1;
		while (name in result) {
			name = `${name}${counter++}`;
		}
		result[name] = entryPath;

		if (counter > 1) {
			warn(
				`Entry ${JSON.stringify(entryPath)} has a name collision with another entry. It has been renamed to ${JSON.stringify(name)} in the Rollup input options.`,
			);
		}
	}

	return result;
}

function simplifyEntryName(entryPath: string) {
	let result = basename(entryPath);
	if (
		result.endsWith(".ts") ||
		result.endsWith(".js") ||
		result.endsWith(".tsx") ||
		result.endsWith(".jsx")
	) {
		result = result.replace(/\.[^/.]+$/, "");
	}

	return result;
}
