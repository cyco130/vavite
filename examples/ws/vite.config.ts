import { defineConfig } from "vite";
import { vavite } from "vavite";

export default defineConfig({
	appType: "custom",
	environments: {
		client: {
			build: {
				manifest: true,
				outDir: "dist/client",
				rollupOptions: {
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
