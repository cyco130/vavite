import { VaviteConfig } from "vavite";
import { Plugin, UserConfig, SSROptions, ResolvedConfig } from "vite";
import { build } from "esbuild";
import path from "path";
import { builtinModules } from "module";
import fs from "fs";

export default function vaviteCloudflareWorkers(): Plugin {
	let resolvedConfig: ResolvedConfig & { vavite: VaviteConfig };

	return {
		name: "@vavite/cloudflare-workers",

		config(cfg, env) {
			if (env.command !== "build") return;

			const originalOutDir: string =
				(cfg as any).vavite?.originalOutDir || "dist";

			const clientOutDir = path.join(originalOutDir, "bundled/static");
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
					serverEntry: "@vavite/cloudflare-workers/entry",
					clientOutDir,
					serverOutDir,
				},

				ssr: {
					target: "webworker",
				},

				resolve: {
					mainFields: ["module", "main", "browser"],
					conditions: ["worker"],
				},

				build: {
					outDir: cfg.build?.ssr ? serverOutDir : clientOutDir,
				},
			};

			return config;
		},

		configResolved(config) {
			// This hack is needed to remove a `require` call inserted by this builtin Vite plugin.
			(config.plugins as any) = config.plugins.filter(
				(x) => x && x.name !== "vite:ssr-require-hook",
			);

			resolvedConfig = config as any;
		},

		async closeBundle() {
			if (resolvedConfig.command !== "build" || !resolvedConfig.build.ssr) {
				return;
			}

			resolvedConfig.logger.info("Bundling for Cloudflare Workers");

			const entry = path.join(resolvedConfig.vavite.serverOutDir, "index.js");
			const distDir = path.dirname(resolvedConfig.vavite.clientOutDir);
			const bundledEntry = path.join(distDir, "index.js");

			await build({
				bundle: true,
				minify: true,
				entryPoints: [entry],
				outfile: bundledEntry,
				platform: "browser",
				target: "chrome96",
				format: "esm",
				mainFields: ["module", "main", "browser"],
				external: builtinModules,
			});

			await fs.promises.writeFile(
				path.join(distDir, "package.json"),
				`{"main":"index.js"}`,
			);
		},
	};
}
