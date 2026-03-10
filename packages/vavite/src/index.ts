import {
	isRunnableDevEnvironment,
	type ConfigPluginContext,
	type Connect,
	type Plugin,
} from "vite";
import { exposeEnvironment as exposeEnvironmentPlugin } from "./expose-environment";
import { exposeDevServer as exposeDevServerPlugin } from "./expose-dev-server";
import { basename } from "node:path";

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

export interface VaviteEntry {
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
	 * Whether to add the entry to the Rollup input options. This is usually what you want.
	 *
	 * @default true
	 */
	addEntryToInputOptions?: boolean | string;
}

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
					config.environments[environmentName].build.rollupOptions ??= {};
					config.environments[environmentName].build.rollupOptions.input ??= {};

					const normalizedInput = addToRollupInput(
						config.environments[environmentName].build.rollupOptions.input,
						entries,
						this.warn,
					);

					config.environments[environmentName].build.rollupOptions.input =
						normalizedInput;
				}
			},
		},

		configResolved(config) {
			// Try to determine whether to register the middleware before or after Vite's own
			// middlewares based on whether a client entry is explicitly defined in the config.
			const input =
				config.build.rollupOptions.input ??
				config.environments.client?.build.rollupOptions.input;

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
			const postMiddlewares: Connect.NextHandleFunction[] = [];

			for (const entry of entries) {
				const {
					environment: environmentName = "ssr",
					entry: entryPath = "/src/entry.server",
					exportName = "default",
					order = defaultMiddlewareOrder,
				} = entry;

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

				const vaviteMiddleware: Connect.NextHandleFunction = async (
					req,
					res,
					next,
				) => {
					const quotedEntry = JSON.stringify(entryPath);
					try {
						const module = await environment.runner.import(entryPath);
						const imported = module[exportName];
						if (typeof imported !== "function") {
							throw new Error(
								`[vavite] ${quotedEnvironmentName} environment entry ${quotedEntry} doesn't export a function as ${JSON.stringify(exportName)}`,
							);
						}

						const handler: Connect.NextHandleFunction = imported;

						await handler(req, res, next);
					} catch (error) {
						next(error);
					}
				};

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
