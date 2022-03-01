import {
	InlineConfig,
	resolveConfig,
	build,
	ResolvedConfig,
	Plugin,
	UserConfig,
} from "vite";
import colors from "picocolors";

export interface BuildStep {
	name: string;
	config?: UserConfig;
}

export interface VaviteMultiBuildInfo {
	buildSteps: BuildStep[];
	currentStepIndex: number;
	currentStep: BuildStep;
}

export default async function multibuild(config: InlineConfig = {}) {
	const initialConfig = await resolveConfig(
		{ ...config, mode: "multibuild" },
		"build",
	).catch((error) => {
		console.error(colors.red(`error resolving config:\n${error.stack}`), {
			error,
		});
		process.exit(1);
	});

	const steps = initialConfig.buildSteps || [{ name: "default" }];

	const forwarded: Record<string, any> = {};

	for (const [i, step] of steps.entries()) {
		let resolvedStepConfig: ResolvedConfig;

		initialConfig.logger.info(
			(i ? "\n" : "") +
				colors.cyan("vavite: ") +
				colors.white("running build step") +
				" " +
				colors.blue(step.name) +
				" (" +
				colors.green(i + 1 + "/" + steps.length) +
				")",
		);

		await build({
			...step.config,
			currentBuildStep: step,
			plugins: [
				{
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

						const info = {
							buildSteps: steps,
							currentStepIndex: i,
							currentStep: step,
						};

						for (const plugin of plugins) {
							await plugin.buildStepStart?.(info, forwarded[plugin.name]);
						}
					},

					configResolved(resolvedConfig) {
						resolvedStepConfig = resolvedConfig;
					},
				},

				...(step.config?.plugins || []),
			],
		}).catch((error) => {
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
