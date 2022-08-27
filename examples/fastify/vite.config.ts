import { defineConfig } from "vite";
import vavite from "vavite";

export default defineConfig({
	server: {
		hmr: {
			// Fastify seems to call handleUpgrade itself
			// causing a conflict with Vite's HMR websocket server.
			// Selecting a different port for the HMR websocket server
			// seems to fix the issue.
			port: 4000,
		},
	},
	plugins: [
		vavite({
			serverEntry: "/server.ts",
			reloadOn: "static-deps-change",
			serveClientAssetsInDev: true,
		}),
	],
});
