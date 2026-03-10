import { defineConfig } from "vite";
import { vavite } from "vavite";

export default defineConfig({
	appType: "custom",
	builder: {
		async buildApp(builder) {
			await builder.build(builder.environments.ssr!);
		},
	},
	plugins: [
		vavite({
			entries: [{ entry: "/src/entry.server", order: "post" }],
		}),
	],
});
