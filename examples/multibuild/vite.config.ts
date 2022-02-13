import { defineConfig } from "vite";
import vaviteConnect from "@vavite/connect";
import vaviteDevServer from "@vavite/dev-server";
import vaviteMultiBuild from "@vavite/multibuild";

export default defineConfig({
	plugins: [
		vaviteMultiBuild({
			buildSteps: [
				{
					name: "client",
					config: {
						build: {
							outDir: "dist/client",
							rollupOptions: {
								// Client entry
								input: "/client",
							},
							manifest: true,
						},
					},
				},
				{
					name: "server",
					config: {
						build: {
							ssr: true,
							outDir: "dist/server",
						},
					},
				},
			],
		}),

		vaviteConnect({
			handlerEntry: "/handler",
			clientAssetsDir: "dist/client",
			serveClientAssetsInDev: true,
		}),

		vaviteDevServer(),
	],
});
