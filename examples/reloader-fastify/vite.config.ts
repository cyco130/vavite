import { defineConfig } from "vite";
import vaviteReloader from "@vavite/reloader";
import vaviteDevServer from "@vavite/dev-server";

export default defineConfig({
	plugins: [
		vaviteReloader({
			reloadOn: "static-deps-change",
			serveClientAssetsInDev: true,
		}),
		vaviteDevServer(),
	],
});
