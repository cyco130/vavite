import { defineConfig, ViteDevServer } from "vite";
import { nodeLoaderPlugin } from "@vavite/node-loader/plugin";
import vavite from "vavite";

declare global {
	// eslint-disable-next-line no-var
	var __vite_dev_server__: ViteDevServer | undefined;
}

export default defineConfig({
	appType: "custom",
	plugins: [nodeLoaderPlugin(), vavite({ serverEntry: "entry-node.ts" })],
});
