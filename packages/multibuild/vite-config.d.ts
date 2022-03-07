import "vite";
import { BuildStep, VaviteMultiBuildInfo } from "./dist";

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
