import { defineConfig } from "vite";
import vaviteConnect from "@vavite/connect";

export default defineConfig({
	plugins: [
		vaviteConnect({
			customServerEntry: "server.ts",
		}),
	],
});
