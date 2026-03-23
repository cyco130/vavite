import { defineConfig } from "vite";
import { vavite } from "vavite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	appType: "custom",
	environments: {
		client: {
			build: {
				manifest: true,
				outDir: "dist/client",
				// or rollupOptions for Vite v7
				rolldownOptions: {
					input: {
						"entry.client": "/src/entry.client.tsx",
					},
				},
			},
		},
		ssr: {
			build: {
				outDir: "dist/server",
			},
		},
	},

	plugins: [react(), vavite()],
});
