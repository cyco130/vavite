import "vite";

declare module "vite" {
	interface Plugin {
		vaviteBuildStepStarted?: (stepName: string) => void;
	}
}
