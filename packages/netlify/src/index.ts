import { VaviteConfig } from "vavite";
import { Plugin, UserConfig, SSROptions, ResolvedConfig } from "vite";
import { build } from "esbuild";
import path from "path";
import fs from "fs";

export default function vaviteNetlify(): Plugin {
	let resolvedConfig: ResolvedConfig & { vavite: VaviteConfig };

	return {
		name: "@vavite/netlify",

		config(cfg, env) {
			if (env.command !== "build") return;

			const originalOutDir: string =
				(cfg as any).vavite?.originalOutDir || "netlify";

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
					serverEntry: "@vavite/netlify/entry",
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

			resolvedConfig.logger.info("Bundling for Netlify Functions");

			const entry = path.join(resolvedConfig.vavite.serverOutDir, "index.js");
			const distDir = path.dirname(resolvedConfig.vavite.clientOutDir);
			const bundledEntry = path.join(distDir, "functions/render.js");

			await build({
				bundle: true,
				entryPoints: [entry],
				outfile: bundledEntry,
				platform: "node",
				target: "node12",
				format: "cjs",
			});

			await fs.promises.writeFile(
				path.join(distDir, "static/_redirects"),
				"/*  /.netlify/functions/render  200\n",
			);
		},
	};
}
