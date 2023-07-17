import {
	InlineConfig,
	resolveConfig,
	build,
	ResolvedConfig,
	Plugin,
	UserConfig,
	mergeConfig,
} from "vite";
import colors from "picocolors";

export type BuildStep = ViteBuildStep | CustomBuildStep;

export interface ViteBuildStep {
	name: string;
	description?: string;
	config?: UserConfig;
	vite?: true;
}

export interface CustomBuildStep {
	vite: false;
	name: string;
	description?: string;
	run(
		info: VaviteMultiBuildInfo,
		forwarded: Record<string, any>,
	): void | Promise<void> | Record<string, any> | Promise<Record<string, any>>;
}

export interface VaviteMultiBuildInfo {
	buildSteps: BuildStep[];
	currentStepIndex: number;
	currentStep: BuildStep;
}

export interface MultibuildOptions {
	onMissingConfigFile?(
		resolvedConfig: ResolvedConfig,
	): InlineConfig | undefined | Promise<InlineConfig | undefined>;

	onInitialConfigResolved?(
		resolvedConfig: ResolvedConfig,
	): void | Promise<void>;

	onStartBuildStep?(info: VaviteMultiBuildInfo): void | Promise<void>;
}

export default async function multibuild(
	config: InlineConfig = {},
	options: MultibuildOptions = {},
) {
	let initialConfig = await resolveConfig(
		{
			...config,
			mode: "multibuild",
		},
		"build",
	).catch((error) => {
		console.error(colors.red(`error resolving config:\n${error.stack}`), {
			error,
		});
		process.exit(1);
	});

	if (!initialConfig.configFile && options.onMissingConfigFile) {
		const maybeInlineConfig = await options.onMissingConfigFile(initialConfig);
		if (maybeInlineConfig) {
			initialConfig = await resolveConfig(
				{
					...maybeInlineConfig,
					mode: "multibuild",
				},
				"build",
			).catch((error) => {
				console.error(colors.red(`error resolving config:\n${error.stack}`), {
					error,
				});
				process.exit(1);
			});
		}
	}

	await options?.onInitialConfigResolved?.(initialConfig);

	const steps = initialConfig.buildSteps || [{ name: "default" }];

	const forwarded: Record<string, any> = {};

	for (const [i, step] of steps.entries()) {
		let resolvedStepConfig: ResolvedConfig;

		const info = {
			buildSteps: steps,
			currentStepIndex: i,
			currentStep: step,
		};

		await options.onStartBuildStep?.(info);

		if (step.vite === false) {
			const result = await step.run(info, forwarded);
			if (result !== undefined) {
				forwarded[step.name] = result;
			}

			continue;
		}

		const multibuildPlugin: Plugin = {
			name: "@vavite/multibuild",

			enforce: "pre",

			async config(config) {
				function enforceToNumber(enforce?: "pre" | "post") {
					return enforce ? (enforce === "pre" ? -1 : 1) : 0;
				}

				const plugins = (
					(config.plugins || []).flat().filter(Boolean) as Plugin[]
				).sort(
					(a, b) => enforceToNumber(a.enforce) - enforceToNumber(b.enforce),
				);

				for (const plugin of plugins) {
					await plugin.buildStepStart?.(info, forwarded[plugin.name]);
				}
			},

			configResolved(resolvedConfig) {
				resolvedStepConfig = resolvedConfig;
			},
		};

		const mergedConfig = mergeConfig(mergeConfig(config, step.config ?? {}), {
			plugins: [multibuildPlugin],
		});

		await build(mergedConfig).catch((error) => {
			initialConfig.logger.error(
				colors.red(`error during build:\n${error.stack}`),
				{ error },
			);
			process.exit(1);
		});

		for (const plugin of resolvedStepConfig!.plugins || []) {
			const data = await plugin.buildStepEnd?.();
			if (data !== undefined) {
				forwarded[plugin.name] = data;
			}
		}
	}
}

declare module "vite" {
	interface UserConfig {
		buildSteps?: BuildStep[];
		currentBuildStep?: BuildStep;
	}

	interface Plugin {
		/**
		 * Called before a build step starts.
		 * @param info      Info about the build step (and build steps in general).
		 * @param forwarded Data forwarded from the previous build step.
		 */
		buildStepStart?(
			info: VaviteMultiBuildInfo,
			forwarded: any,
		): void | Promise<void>;

		/**
		 * Called after a build step has finished. The return value will be forwarded
		 * to the next build step as a way of sharing information between steps.
		 */
		buildStepEnd?(): any | Promise<any>;
	}
}
