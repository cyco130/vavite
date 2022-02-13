/// <reference types="../ambient" />

import { build, Plugin, ResolvedConfig, UserConfig } from "vite";

VAVITE_MULTIBUILD_CURRENT_STEP_INDEX = 0;

export interface VaviteMultiBuildOptions {
	buildSteps: BuildStep[];
}

export interface BuildStep {
	name: string;
	config?: UserConfig;
}

export interface VaviteMultiBuildInfo {
	buildSteps: BuildStep[];
	currentStepIndex: number;
	currentStep: BuildStep;
}

export default function vaviteMultiBuild(
	options: VaviteMultiBuildOptions,
): Plugin[] {
	const { buildSteps } = options;
	let resolvedConfig: ResolvedConfig;

	if (buildSteps.length === 0) return [];

	return [
		{
			name: "@vavite/multibuild:pre",

			enforce: "pre",

			apply: "build",

			async config(config) {
				if (!buildSteps[VAVITE_MULTIBUILD_CURRENT_STEP_INDEX]) return;

				let out: UserConfig = {};

				if (
					VAVITE_MULTIBUILD_CURRENT_STEP_INDEX === 0 &&
					buildSteps[VAVITE_MULTIBUILD_CURRENT_STEP_INDEX].config
				) {
					out = buildSteps[VAVITE_MULTIBUILD_CURRENT_STEP_INDEX].config!;
				}

				const info: VaviteMultiBuildInfo = {
					buildSteps,
					currentStepIndex: VAVITE_MULTIBUILD_CURRENT_STEP_INDEX,
					currentStep: buildSteps[VAVITE_MULTIBUILD_CURRENT_STEP_INDEX],
				};

				function enforceToNumber(enforce?: "pre" | "post") {
					return enforce ? (enforce === "pre" ? -1 : 1) : 0;
				}

				const plugins = (
					(config.plugins || []).flat().filter(Boolean) as Plugin[]
				).sort(
					(a, b) => enforceToNumber(a.enforce) - enforceToNumber(b.enforce),
				);

				const forwardedStore = (config as any).vaviteMultiBuildInfo || {};

				for (const plugin of plugins) {
					await plugin.vaviteBuildStepStart?.(
						info,
						forwardedStore[plugin.name],
					);
				}

				return out;
			},

			configResolved(config) {
				config.logger.info(
					`Starting build step '${
						buildSteps[VAVITE_MULTIBUILD_CURRENT_STEP_INDEX].name
					}' (${VAVITE_MULTIBUILD_CURRENT_STEP_INDEX + 1}/${
						buildSteps.length
					})`,
				);

				resolvedConfig = config;
			},
		},
		{
			name: "@vavite/multibuild:post",

			enforce: "post",

			apply: "build",

			async closeBundle() {
				VAVITE_MULTIBUILD_CURRENT_STEP_INDEX++;

				const store: Record<string, any> = {};
				for (const plugin of resolvedConfig.plugins) {
					store[plugin.name] = await plugin.vaviteBuildStepEnd?.();
				}

				if (VAVITE_MULTIBUILD_CURRENT_STEP_INDEX >= buildSteps.length) return;

				await build({
					...buildSteps[VAVITE_MULTIBUILD_CURRENT_STEP_INDEX].config,
					vaviteMultiBuildInfo: store,
				} as any);
			},
		},
	];
}
