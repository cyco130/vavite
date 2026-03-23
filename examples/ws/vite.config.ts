import { defineConfig } from "vite";
import { vavite } from "vavite";

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
						"entry.client": "/src/entry.client.ts",
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
	plugins: [vavite()],
});
