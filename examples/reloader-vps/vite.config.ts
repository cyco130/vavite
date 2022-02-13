import react from "@vitejs/plugin-react";
import ssr from "vite-plugin-ssr/plugin";
import { UserConfig } from "vite";
import vaviteReloader from "@vavite/reloader";
import vaviteDevServer from "@vavite/dev-server";
import vaviteMultiBuild from "@vavite/multibuild";

const config: UserConfig = {
	plugins: [
		vaviteMultiBuild({
			buildSteps: [
				{ name: "client" },
				{
					name: "server",
					config: {
						build: {
							ssr: true,
							rollupOptions: {
								input: { index: "server/index.ts" },
								output: {
									// We have to disable this for multiple entries
									inlineDynamicImports: false,
								},
							},
						},
					},
				},
			],
		}),
		vaviteReloader({ serveClientAssetsInDev: true }),
		vaviteDevServer(),
		react(),
		ssr(),
	],
};

export default config;
