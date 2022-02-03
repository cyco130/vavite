import { defineConfig } from "vite";
import vaviteReloader from "@vavite/reloader";

export default defineConfig({
	plugins: [vaviteReloader({ reloadOn: "static-deps-change" })],
});
