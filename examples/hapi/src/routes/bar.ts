import viteDevServer from "vavite:vite-dev-server";
import nav from "./nav";
import type { AppRouteHandler } from "../entry.server";

const barRoute: AppRouteHandler = {
	method: "GET",
	path: "/bar",
	async handler(req) {
		let html = "<h1>Hello from page /bar</h1>" + nav;

		if (viteDevServer) {
			html = await viteDevServer.transformIndexHtml(req.path, html);
		}

		return html;
	},
};

export default barRoute;
