import type { Plugin } from "vite";

export interface VaviteConnectOptions {
	/** Entry module that default exports a middleware function.
	 * @default "/index" (which resolves to index.js, index.ts etc.
	 * in your project root)
	 */
	handlerEntry?: string;

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

export default function vaviteConnect({
	handlerEntry = "/index",
	serveClientAssetsInDev = false,
	standalone = true,
	clientAssetsDir = null,
	bundleSirv = true,
}: VaviteConnectOptions = {}): Plugin[] {
	return [
		{
			name: "@vavite/connect:resolve",

			enforce: "pre",

			resolveId(id) {
				if (
					id === "@vavite/connect/handler" ||
					id === "@vavite/connect/user-handler"
				) {
					return id;
				} else if (id.endsWith("virtual:@vavite/connect/entry/index")) {
					return "@vavite/connect/entry/index";
				}
			},

			async load(id, options) {
				if (id === "@vavite/connect/handler") {
					const resolved = await this.resolve(
						clientAssetsDir
							? bundleSirv
								? "@vavite/connect/entry-middleware-with-sirv"
								: "@vavite/connect/entry-middleware-with-external-sirv"
							: handlerEntry,
						undefined,
						{ ...options, skipSelf: true },
					);

					if (resolved) {
						const loaded = await this.load(resolved);
						return loaded.code;
					}
				} else if (id === "@vavite/connect/user-handler") {
					const resolved = await this.resolve(handlerEntry, undefined, {
						...options,
						skipSelf: true,
					});

					if (resolved) {
						const loaded = await this.load(resolved);
						return loaded.code;
					}
				} else if (id === "@vavite/connect/entry/index") {
					const resolved = await this.resolve(
						"@vavite/connect/entry-standalone",
						undefined,
						{
							...options,
							skipSelf: true,
						},
					);

					if (resolved) {
						const loaded = await this.load(resolved);
						return loaded.code;
					}
				}
			},
		},
		{
			name: "@vavite/connect:server",

			enforce: "post",

			config(config, env) {
				if (env.command === "build" && config.build?.ssr) {
					if (config.build?.ssr === true) {
						config.build.ssr = standalone
							? "/virtual:@vavite/connect/entry/index"
							: handlerEntry;
					}

					if (clientAssetsDir) {
						return {
							define: {
								__VAVITE_CLIENT_BUILD_OUTPUT_DIR:
									JSON.stringify(clientAssetsDir),
							},
						};
					}
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
