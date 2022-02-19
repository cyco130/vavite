/// <reference types="@vavite/multivite/ambient" />

import react from "@vitejs/plugin-react";
import ssr from "vite-plugin-ssr/plugin";
import { UserConfig } from "vite";
import vaviteReloader from "@vavite/reloader";
import exposeViteDevServer from "@vavite/expose-vite-dev-server";
// import vaviteMultiBuild from "@vavite/multibuild";

const config: UserConfig = {
	plugins: [
		/*
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
		*/
		vaviteReloader({ serveClientAssetsInDev: true }),
		exposeViteDevServer(),
		react(),
		ssr(),
	],
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
};

export default config;
