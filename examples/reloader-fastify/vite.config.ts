import { defineConfig } from "vite";
import vaviteReloader from "@vavite/reloader";
import exposeViteDevServer from "@vavite/expose-vite-dev-server";

export default defineConfig({
	plugins: [
		vaviteReloader({
			reloadOn: "static-deps-change",
			serveClientAssetsInDev: true,
		}),
		exposeViteDevServer(),
	],
});
