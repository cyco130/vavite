import "vite";
import { VaviteMultiBuildInfo } from ".";

declare global {
	let VAVITE_MULTIBUILD_CURRENT_STEP_INDEX: number;
}

declare module "vite" {
	interface Plugin {
		/**
		 * Called before a build step starts.
		 * @param info      Info about the build step (and build steps in general).
		 * @param forwarded Data forwarded from the previous build step.
		 */
		vaviteBuildStepStart?(
			info: VaviteMultiBuildInfo,
			forwarded: any,
		): void | Promise<void>;

		/**
		 * Called after a build step has finished. The return value will be forwarded
		 * to the next build step as a way of sharing information between steps.
		 */
		vaviteBuildStepEnd?(): any | Promise<any>;
	}
}
