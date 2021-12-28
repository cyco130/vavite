declare module "vavite" {
	export * from "./dist";
	export { default } from "./dist";
}

declare module "@vavite/manifest" {
	const manifest: import("./dist").ViteManifest;
	export default manifest;
}

declare module "@vavite/ssr-manifest" {
	const manifest: import("./dist").ViteSsrManifest;
	export default manifest;
}

declare module "@vavite/html" {
	const html: string;
	export default html;
}
