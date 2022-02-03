import { defineConfig } from "vite";
import vaviteReloader from "@vavite/reloader";
import vaviteDevServerMethods from "@vavite/dev-server-methods/plugin";

export default defineConfig({
	plugins: [
		vaviteReloader({
			reloadOn: "static-deps-change",
			serveClientAssetsInDev: true,
		}),
		vaviteDevServerMethods(),
	],
});
