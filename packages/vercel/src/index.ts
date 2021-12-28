import { VaviteConfig } from "vavite";
import { Plugin, UserConfig, SSROptions, ResolvedConfig } from "vite";
import { build } from "esbuild";
import path from "path";
import fs from "fs";

export default function vaviteVercel(): Plugin {
	let resolvedConfig: ResolvedConfig & { vavite: VaviteConfig };

	return {
		name: "@vavite/vercel",

		config(cfg, env) {
			if (env.command !== "build") return;

			const originalOutDir: string =
				(cfg as any).vavite?.originalOutDir || ".output";

			const clientOutDir = path.join(originalOutDir, "static");
			const serverOutDir = path.join(originalOutDir, "unbundled");

			const config: UserConfig & {
				vavite?: {
					serverEntry?: string;
					originalOutDir?: string;
					clientOutDir?: string;
					serverOutDir?: string;
				};
			} & {
				ssr?: SSROptions;
			} = {
				vavite: {
					serverEntry: "@vavite/vercel/entry",
					clientOutDir,
					serverOutDir,
				},

				build: {
					outDir: cfg.build?.ssr ? serverOutDir : clientOutDir,
				},
			};

			return config;
		},

		configResolved(config) {
			resolvedConfig = config as any;
		},

		async closeBundle() {
			if (resolvedConfig.command !== "build" || !resolvedConfig.build.ssr) {
				return;
			}

			resolvedConfig.logger.info("Bundling for Vercel");

			const entry = path.join(resolvedConfig.vavite.serverOutDir, "index.js");
			const distDir = path.dirname(resolvedConfig.vavite.clientOutDir);
			const bundledEntry = path.join(distDir, "server/pages/index.js");

			await build({
				bundle: true,
				entryPoints: [entry],
				outfile: bundledEntry,
				platform: "node",
				target: "node12",
				format: "cjs",
			});

			await fs.promises.writeFile(
				path.join(distDir, "routes-manifest.json"),
				JSON.stringify({
					version: 3,
					basePath: "/",
					pages404: false,
					dynamicRoutes: [
						{
							page: "/",
							regex: "/(.*)",
						},
					],
				}),
			);

			await fs.promises.writeFile(
				path.join(distDir, "functions-manifest.json"),
				JSON.stringify({
					version: 1,
					pages: {
						"index.js": {
							maxDuration: 10,
						},
					},
				}),
			);
		},
	};
}
