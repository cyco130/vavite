import { Plugin, build, ResolvedConfig } from "vite";
import path from "path";
import { OutgoingResponse, RawResponse, RequestHandler, VaviteConfig } from ".";
import { parseRequest } from "./node-helpers";

export interface VaviteOptions {
	handlerEntry?: string;
	serverEntry?: string;
}

export default function vavite({
	handlerEntry = "handler",
	serverEntry,
}: VaviteOptions = {}): Plugin[] {
	let clientBuild = false;
	let handlerPath: string;
	let resolvedConfig: ResolvedConfig & { vavite: VaviteConfig };
	let serverEntryPath: string;

	return [
		{
			name: "vavite",

			enforce: "pre",

			async resolveId(id, importer, options) {
				if (id === "index.js") {
					const resolved = await this.resolve(
						serverEntry || resolvedConfig.vavite?.serverEntry || "vavite/entry",
						importer,
						{
							...options,
							skipSelf: true,
						},
					);

					if (resolved) serverEntryPath = resolved.id;

					return resolved;
				} else if (id === "vavite/manifest") {
					if (resolvedConfig.command === "serve") return id;

					return this.resolve(
						path.join("/", resolvedConfig.vavite.clientOutDir, "manifest.json"),
						importer,
						options,
					);
				} else if (id === "vavite/ssr-manifest") {
					if (resolvedConfig.command === "serve") return id;

					return this.resolve(
						path.join(resolvedConfig.vavite.clientOutDir, "ssr-manifest.json"),
						importer,
						options,
					);
				} else if (id === "vavite/html") {
					return this.resolve(
						path.join(
							resolvedConfig.command === "serve"
								? resolvedConfig.root
								: "/" + resolvedConfig.vavite.clientOutDir,
							"index.html?raw",
						),
						importer,
						options,
					);
				} else if (id === "vavite/handler") {
					return this.resolve(handlerPath);
				}
			},

			load(id) {
				if (id === "vavite/manifest") {
					return MANIFEST_STUB;
				} else if (id === "vavite/ssr-manifest") {
					return SSR_MANIFEST_STUB;
				}
			},

			config(config) {
				const outDir = config.build?.outDir;

				const vavite = {
					originalOutDir: outDir,
					clientOutDir: path.join(outDir || "dist", "client"),
					serverOutDir: path.join(outDir || "dist", "server"),
				};

				if (config.build?.ssr) {
					return {
						vavite,
						publicDir: false,
						ssr: {
							noExternal: ["vavite/handler", "vavite/manifest"],
						},
						build: {
							outDir: vavite.serverOutDir,
						},
					};
				} else {
					return {
						vavite,
						build: {
							manifest: true,
							ssrManifest: true,
							outDir: vavite.clientOutDir,
						},
					};
				}
			},

			configResolved(config) {
				resolvedConfig = config as any;

				if (config.command === "build") {
					handlerPath = path.join(config.root, handlerEntry);

					if (config.build.ssr) {
						config.build.rollupOptions.input = "index.js";
						config.build.rollupOptions.output = {
							...config.build.rollupOptions.output,
							entryFileNames: (chunk) => {
								if (chunk.facadeModuleId === serverEntryPath) {
									return "index.js";
								}

								return "[name].js";
							},
						};
					} else {
						clientBuild = true;
						config.build.rollupOptions.input = config.build.rollupOptions
							.input || ["index.html"];
					}
				}
			},

			async closeBundle() {
				if (!clientBuild) return;

				await build({
					build: { ssr: true },
				});
			},

			async configureServer(server) {
				const entryFileName = path.resolve(server.config.root, handlerEntry);

				return () =>
					server.middlewares.use(async (req, res, next) => {
						async function renderError(status: number, message: string) {
							server.config.logger.error(message);

							let html = `<!DOCTYPE html><html><head><title>SSR Error</title></head><body><h1>SSR Error</h1><pre>${escapeHtml(
								message,
							)}</pre></body></html>`;

							html = await server.transformIndexHtml(
								req.originalUrl || "/",
								html,
							);

							res.statusCode = status;
							res.setHeader("Content-Type", "text/html; charset=utf-8");
							res.end(html);
						}

						const entry = await server.pluginContainer.resolveId(
							entryFileName,
							undefined,
							{ ssr: true },
						);

						if (!entry) {
							return renderError(
								404,
								`Could not resolve handler entry "${entryFileName}". Create an "handler.(ts|js)x?" file in your root directory or set it in vavite options.`,
							);
						}

						const { default: handler } = (await server.ssrLoadModule(
							entry.id,
						)) as { default: RequestHandler };

						if (typeof handler !== "function") {
							return renderError(
								500,
								`"${entryFileName}" doesn't default export a function.`,
							);
						}

						try {
							// Restore the original URL
							req.url = req.originalUrl;
							const protocol = server.config.server.https ? "https:" : "http:";
							const host = req.headers.host || "localhost";
							const origin = protocol + host;

							const request = parseRequest(
								origin,
								req.socket.remoteAddress || "",
								req,
								res,
							);

							const response: undefined | OutgoingResponse | RawResponse =
								await handler(request);

							if (!response) {
								next();
								return;
							}

							if ("raw" in response) {
								return;
							}

							res.statusCode = response.status || 200;

							let isHtml = false;
							for (const [key, value] of Object.entries(
								response.headers || {},
							)) {
								if (value === undefined) continue;
								if (key.toLowerCase() === "content-type") {
									isHtml = String(value).toLowerCase().includes("text/html");
								}
								res.setHeader(key, value);
							}

							const { body } = response;

							if (isHtml) {
								// We have to parse the response body as a string
								let html = "";
								if (typeof body === "string") {
									html = body;
								} else if (body instanceof Uint8Array) {
									html = Buffer.from(body).toString("utf8");
								} else if (body && Symbol.asyncIterator in body) {
									let chunks: string[] | Uint8Array[] = [];
									for await (const chunk of body) {
										html += chunk;
									}
									if (chunks[0] instanceof Uint8Array) {
										html = Buffer.from(chunks[0]).toString("utf8");
									} else {
										html = chunks.join("");
									}
								}

								html = await server.transformIndexHtml(
									req.originalUrl || req.url || "/",
									html,
								);

								res.end(html);
							} else if (
								body &&
								typeof body === "object" &&
								Symbol.asyncIterator in body
							) {
								for await (const chunk of body) {
									// TODO: Should we await for the drain event if it's full?
									res.write(chunk);
								}
							} else if (body) {
								res.write(body);
							}

							res.end();
						} catch (err) {
							if (err instanceof Error) {
								server.ssrFixStacktrace(err);
								return renderError(500, err.stack || err.message);
							} else {
								return renderError(500, "Unknown error");
							}
						}
					});
			},
		},
	];
}

function escapeHtml(unsafe: string) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

const MANIFEST_STUB = `export default new Proxy(
	{},
	{
		get(_, prop) {
			return { file: prop };
		},
	},
)`;

const SSR_MANIFEST_STUB = `export default {}`;
