interface ImportMetaEnv {
	readonly COMMAND: "build" | "serve";
	readonly ENVIRONMENT: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare module "vavite:vite-dev-server" {
	const viteDevServer: import("vite").ViteDevServer | undefined;
	export default viteDevServer;
}
