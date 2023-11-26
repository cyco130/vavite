import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import ssr from "vike/plugin";
import { vavite } from "vavite";

export default defineConfig({
	buildSteps: [
		{ name: "client" },
		{
			name: "server",
			config: {
				build: { ssr: true },
			},
		},
	],

	plugins: [
		vavite({
			serverEntry: "/server/index.ts",
			serveClientAssetsInDev: true,
		}),
		react(),
		ssr({ disableAutoFullBuild: true }),
	],
});
