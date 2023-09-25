import {
	BuildOptions,
	createServer,
	InlineConfig,
	LogLevel,
	ResolvedConfig,
	ServerOptions,
	version as viteVersion,
} from "vite";
import { cac } from "cac";
import { multibuild } from "@vavite/multibuild";
import { version } from "../package.json";
import pico from "picocolors";
import { spawn } from "node:child_process";

const startTime = performance.now();

const [major, minor] = process.version
	.slice(1)
	.split(".")
	.map((x) => Number(x));

const loaderAvailable =
	(major > 16 || (major === 16 && minor >= 12)) && major < 20;

interface GlobalCLIOptions {
	"--"?: string[];
	c?: boolean | string;
	config?: string;
	base?: string;
	l?: LogLevel;
	logLevel?: LogLevel;
	clearScreen?: boolean;
	d?: boolean | string;
	debug?: boolean | string;
	f?: string;
	filter?: string;
	m?: string;
	mode?: string;
}

const cli = cac("vavite");

/**
 * removing global flags before passing as command specific sub-configs
 */
function cleanOptions<Options extends GlobalCLIOptions>(
	options: Options,
): Omit<Options, keyof GlobalCLIOptions> {
	const ret = { ...options };
	delete ret["--"];
	delete ret.c;
	delete ret.config;
	delete ret.base;
	delete ret.l;
	delete ret.logLevel;
	delete ret.clearScreen;
	delete ret.d;
	delete ret.debug;
	delete ret.f;
	delete ret.filter;
	delete ret.m;
	delete ret.mode;
	return ret;
}

cli
	.command("[root]", "Build for production")
	.alias("build")
	.option("-c, --config <file>", `[string] use specified config file`)
	.option("--base <path>", `[string] public base path (default: /)`)
	.option("-l, --logLevel <level>", `[string] info | warn | error | silent`)
	.option("--clearScreen", `[boolean] allow/disable clear screen when logging`)
	.option("-d, --debug [feat]", `[string | boolean] show debug logs`)
	.option("-f, --filter <filter>", `[string] filter debug logs`)
	.option("-m, --mode <mode>", `[string] set env mode`)
	.option("--target <target>", `[string] transpile target (default: 'modules')`)
	.option("--outDir <dir>", `[string] output directory (default: dist)`)
	.option(
		"--assetsDir <dir>",
		`[string] directory under outDir to place assets in (default: _assets)`,
	)
	.option(
		"--assetsInlineLimit <number>",
		`[number] static asset base64 inline threshold in bytes (default: 4096)`,
	)
	.option(
		"--ssr [entry]",
		`[string] build specified entry for server-side rendering`,
	)
	.option(
		"--sourcemap",
		`[boolean] output source maps for build (default: false)`,
	)
	.option(
		"--minify [minifier]",
		`[boolean | "terser" | "esbuild"] enable/disable minification, ` +
			`or specify minifier to use (default: esbuild)`,
	)
	.option("--manifest", `[boolean] emit build manifest json`)
	.option("--ssrManifest", `[boolean] emit ssr manifest json`)
	.option(
		"--emptyOutDir",
		`[boolean] force empty outDir when it's outside of root`,
	)
	.option("-w, --watch", `[boolean] rebuilds when modules have changed on disk`)
	.option(
		"--force",
		`[boolean] force the optimizer to ignore the cache and re-bundle (experimental)`,
	)
	.action(async (root: string, options: BuildOptions & GlobalCLIOptions) => {
		const buildOptions: BuildOptions = cleanOptions(options);

		let initialConfig: ResolvedConfig;

		process.env.NODE_ENV = options.mode || "production";

		await multibuild(
			{
				root,
				base: options.base,
				mode: options.mode,
				configFile: options.config,
				logLevel: options.logLevel,
				clearScreen: options.clearScreen,
				build: buildOptions,
			},
			{
				onInitialConfigResolved(config) {
					initialConfig = config;
				},

				onStartBuildStep(info) {
					initialConfig.logger.info(
						(info.currentStepIndex ? "\n" : "") +
							pico.cyan("vavite: " + version) +
							(info.currentStep.description
								? pico.white(" " + info.currentStep.description)
								: pico.white(" running build step") +
								  " " +
								  pico.blue(info.currentStep.name)) +
							" (" +
							pico.green(
								info.currentStepIndex + 1 + "/" + info.buildSteps.length,
							) +
							")",
					);
				},
			},
		);
	});

declare global {
	// eslint-disable-next-line no-var
	var __vavite_loader__: boolean;
}

const hasLoader = global.__vavite_loader__;

cli
	.command("serve [root]", "Start a dev server")
	.alias("dev")
	.option("--host [host]", `[string] specify hostname`)
	.option("--port <port>", `[number] specify port`)
	.option("--https", `[boolean] use TLS + HTTP/2`)
	.option("--open [path]", `[boolean | string] open browser on startup`)
	.option("--cors", `[boolean] enable CORS`)
	.option("--strictPort", `[boolean] exit if specified port is already in use`)
	.option(
		"--force",
		`[boolean] force the optimizer to ignore the cache and re-bundle`,
	)
	.option("--use-loader", `[boolean] use ESM loader (experimental)`)
	.action(
		async (
			root: string,
			options: ServerOptions &
				GlobalCLIOptions & {
					useLoader?: boolean;
				},
		) => {
			if (options.useLoader) {
				if (!loaderAvailable) {
					console.warn(
						`--use-loader is ignored as it requires a Node.js version between 16.12 and 20`,
					);
				} else if (!hasLoader) {
					// Rerun the command with the loader options
					const options =
						(process.env.NODE_OPTIONS ? process.env.NODE_OPTIONS + " " : "") +
						"-r vavite/suppress-loader-warnings --loader vavite/node-loader";

					const cp = spawn(process.execPath, process.argv.slice(1), {
						stdio: "inherit",
						env: {
							...process.env,
							NODE_OPTIONS: options,
						},
					});

					cp.on("error", (err) => {
						console.error(err);
						process.exit(1);
					});

					cp.on("exit", (code) => {
						process.exit(code ?? 0);
					});

					return;
				}
			}

			delete options.useLoader;

			const { ...serverOptions }: ServerOptions = cleanOptions(options);
			const inlineConfig: InlineConfig = {
				root,
				base: options.base,
				mode: options.mode,
				configFile: options.config,
				logLevel: options.logLevel,
				clearScreen: options.clearScreen,
				optimizeDeps: { force: options.force },
				server: serverOptions,
			};

			try {
				const server = await createServer(inlineConfig);

				if (!server.httpServer) {
					throw new Error("HTTP server not available");
				}

				await server.listen();

				const info = server.config.logger.info;

				const startupDurationString = startTime
					? pico.dim(
							`(ready in ${pico.white(
								pico.bold(Math.ceil(performance.now() - startTime)),
							)} ms)`,
					  )
					: "";

				info(
					`\n  ${pico.green(
						pico.cyan("vavite: " + version + " (vite: " + viteVersion + ")") +
							" development server is running",
					)} ${startupDurationString}\n`,
					{ clear: !server.config.logger.hasWarned },
				);

				server.printUrls();
			} catch (e: any) {
				console.error(pico.red(`error when starting dev server:\n${e.stack}`), {
					error: e,
				});
				process.exit(1);
			}
		},
	);

cli.help();
cli.version(version);

cli.parse();
