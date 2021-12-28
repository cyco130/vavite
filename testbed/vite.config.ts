import { defineConfig } from "vite";
import vavite from "vavite";
import vaviteCfw from "@vavite/cloudflare-workers";
import vaviteNetlify from "@vavite/netlify";
import vaviteVercel from "@vavite/vercel";

export default defineConfig({
	plugins: [
		vavite({}),
		process.env.DEPLOY_TARGET === "cfw" && vaviteCfw(),
		process.env.DEPLOY_TARGET === "netlify" && vaviteNetlify(),
		process.env.DEPLOY_TARGET === "vercel" && vaviteVercel(),
	],
	build: {
		rollupOptions: {
			input: ["routes/home-client.ts", "routes/react-client.tsx"],
		},
	},
});
