import { defineConfig } from "vite";
import { vavite } from "vavite";

export default defineConfig({
	appType: "custom",
	plugins: [
		vavite({
			handlerEntry: "/server.ts",
			serveClientAssetsInDev: true,
		}),
	],
});
