import { defineConfig } from "vite";
import vavite from "vavite";

export default defineConfig({
	plugins: [vavite({ handlerEntry: "/handler.ts" })],
});
