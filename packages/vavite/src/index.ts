import { Plugin, PluginOption, UserConfig } from "vite";
import vaviteConnect from "@vavite/connect";
import vaviteReloader from "@vavite/reloader";
import vaviteExposeViteDevServer from "@vavite/expose-vite-dev-server";
import { nodeLoaderPlugin } from "@vavite/node-loader/plugin";

declare global {
	// eslint-disable-next-line no-var
	var __vavite_loader__: boolean;
}

const hasLoader = global.__vavite_loader__;

export interface VaviteOptions {
	/** Entry module that default exports a middleware function.
	 * You have to provide either a handler entry or a server entry.
	 * If you provide both, the server entry will only be used in the
	 * production build.
	 */
	handlerEntry?: string;
	/** Server entry point. You have to provide either a handler entry
	 * or a server entry. If you provide both, the server entry will only
	 * be used in the production build.
	 */
	serverEntry?: string;
	/** Whether to serve client-side assets in development.
	 * @default false
	 */
	serveClientAssetsInDev?: boolean;
	/** If you only provide a handler entry, this option controls whether
	 * to build a standalone server application or a middleware function.
	 * @default true
	 */
	standalone?: boolean;
	/** Directory where the client-side assets are located. Set to null to disable
	 * static file serving in production.
	 * @default null
	 */
	clientAssetsDir?: string | null;
	/** Whether to bundle the sirv package or to import it when building in standalone
	 * mode. You have to install it as a production dependency if this is set to false.
	 * @default true
	 */
	bundleSirv?: boolean;
	/**
	 * When to reload the server. "any-change" reloads every time any of the dependencies of the
	 * server entry changes. "static-deps-change" only reloads when statically imported dependencies
	 * change, dynamically imported dependencies are not tracked.
	 * @default "any-change"
	 */
	reloadOn?: "any-change" | "static-deps-change";
}

export default function vavite(options: VaviteOptions): PluginOption {
	const {
		serverEntry,
		handlerEntry,
		serveClientAssetsInDev,
		standalone,
		clientAssetsDir,
		bundleSirv,
		reloadOn,
	} = options;

	if (!serverEntry && !handlerEntry) {
		throw new Error(
			"vavite: either serverEntry or handlerEntry must be specified",
		);
	}

	let buildStepStartCalled = false;

	const plugins: (Plugin | false)[] = [
		{
			name: "vavite:check-multibuild",

			buildStepStart() {
				buildStepStartCalled = true;
			},

			config() {
				return {
					ssr: {
						optimizeDeps: {
							exclude: ["vavite"],
						},
					},
					optimizeDeps: {
						exclude: ["vavite"],
					},
				} as UserConfig;
			},

			configResolved(config) {
				if (
					config.buildSteps &&
					config.command === "build" &&
					config.mode !== "multibuild" &&
					!buildStepStartCalled
				) {
					throw new Error(
						"vavite: You have multiple build steps defined in your Vite config, please use the 'vavite' command instead of 'vite build' to build.",
					);
				}
			},
		},
		hasLoader && nodeLoaderPlugin(),
	];

	if (handlerEntry) {
		plugins.push(
			...vaviteConnect({
				handlerEntry,
				customServerEntry: serverEntry,
				serveClientAssetsInDev,
				standalone,
				clientAssetsDir,
				bundleSirv,
			}),
		);
	} else {
		plugins.push(
			vaviteReloader({
				entry: serverEntry,
				serveClientAssetsInDev,
				reloadOn,
			}),
		);
	}

	plugins.push(vaviteExposeViteDevServer());

	return plugins;
}

export type {
	BuildStep,
	CustomBuildStep,
	VaviteMultiBuildInfo,
	ViteBuildStep,
} from "@vavite/multibuild";
