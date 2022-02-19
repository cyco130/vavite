import type { Plugin } from "vite";

export interface VaviteConnectOptions {
	/** Entry module that default exports a middleware function.
	 * @default "/handler" (which resolves to handler.js, handler.ts etc.
	 * in your project root)
	 */
	handlerEntry?: string;

	/** Cusotm server entry the production build. */
	customServerEntry?: string;

	/** Whether to serve client-side assets in development.
	 * @default false
	 */
	serveClientAssetsInDev?: boolean;

	/** Whether to build a standalone server application or a middleware function.
	 * @default true
	 */
	standalone?: boolean;

	/** Directory where the client-side assets are located. Set to null to disable
	 * static file serving in production.
	 * @default null
	 */
	clientAssetsDir?: string | null;

	/** Whether to bundle the sirv package or to import it. You have to install it as
	 * a production dependency if this is set to false.
	 * @default true
	 */
	bundleSirv?: boolean;
}

export default function vaviteConnect(
	options: VaviteConnectOptions = {},
): Plugin[] {
	const {
		handlerEntry = "/handler",
		customServerEntry,
		serveClientAssetsInDev = false,
		standalone = true,
		clientAssetsDir = null,
		bundleSirv = true,
	} = options;

	let handlerEntryPath: string | null;
	let serverEntryPath: string | null;

	return [
		{
			name: "@vavite/connect:resolve",

			enforce: "pre",

			async resolveId(id, importer, options) {
				if (id === "/virtual:vavite-connect-handler") {
					return this.resolve(handlerEntry, importer, options).then((r) => {
						handlerEntryPath = r && r.id;
						return r;
					});
				} else if (id === "/virtual:vavite-connect-server") {
					return this.resolve(
						clientAssetsDir
							? bundleSirv
								? "@vavite/connect/entry-standalone-bundled-sirv"
								: "@vavite/connect/entry-standalone-imported-sirv"
							: "@vavite/connect/entry-standalone",

						undefined,
						{
							...options,
							skipSelf: true,
						},
					).then((r) => {
						serverEntryPath = r && r.id;
						return r;
					});
				}
			},
		},
		{
			name: "@vavite/connect:server",

			enforce: "post",

			config(config, env) {
				if (env.command === "build" && config.build?.ssr) {
					return {
						build: {
							rollupOptions: {
								input: [
									customServerEntry ||
										(standalone
											? "/virtual:vavite-connect-server"
											: "/virtual:vavite-connect-handler"),
								],
								output: {
									entryFileNames(chunk) {
										if (chunk.facadeModuleId === serverEntryPath) {
											return "server.js";
										} else if (chunk.facadeModuleId === handlerEntryPath) {
											return "handler.js";
										} else {
											return "[name].js";
										}
									},
								},
							},
						},
						define: clientAssetsDir
							? {
									__VAVITE_CLIENT_BUILD_OUTPUT_DIR:
										JSON.stringify(clientAssetsDir),
							  }
							: {},
					};
				}
			},

			configureServer(server) {
				function addMiddleware() {
					server.middlewares.use(async (req, res) => {
						const module = await server.ssrLoadModule(handlerEntry);

						function renderError(status: number, message: string) {
							res.statusCode = status;
							res.end(message);
						}

						// Restore the original URL (SPA middleware may have changed it)
						req.url = req.originalUrl || req.url;

						try {
							await module.default(req, res, () => {
								if (!res.writableEnded) renderError(404, "Not found");
							});
						} catch (err) {
							if (err instanceof Error) {
								server.ssrFixStacktrace(err);
								renderError(500, err.stack || err.message);
							} else {
								renderError(500, "Unknown error");
							}
						}
					});
				}

				if (serveClientAssetsInDev) {
					return addMiddleware;
				} else {
					addMiddleware();
				}
			},
		},
	];
}

import type { Stats } from "fs";
import type { IncomingMessage, ServerResponse } from "http";

type Arrayable<T> = T | T[];

export interface SirvOptions {
	dev?: boolean;
	etag?: boolean;
	maxAge?: number;
	immutable?: boolean;
	single?: string | boolean;
	ignores?: false | Arrayable<string | RegExp>;
	extensions?: string[];
	dotfiles?: boolean;
	brotli?: boolean;
	gzip?: boolean;
	onNoMatch?: (req: IncomingMessage, res: ServerResponse) => void;
	setHeaders?: (res: ServerResponse, pathname: string, stats: Stats) => void;
}
