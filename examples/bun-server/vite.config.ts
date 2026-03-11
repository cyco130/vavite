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
			entries: [
				{
					type: "runnable-server",
					entry: "/src/entry.server",
					proxyOptions: {
						target: `http://localhost:${process.env.PORT || 3000}`,
					},
				},
			],
		}),
	],
});
