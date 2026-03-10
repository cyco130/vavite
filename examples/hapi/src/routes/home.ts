import viteDevServer from "vavite:vite-dev-server";
import nav from "./nav";
import type { AppRouteHandler } from "../entry.server";

const homeRoute: AppRouteHandler = {
	method: "GET",
	path: "/",
	async handler(req) {
		let html = "<h1>Hello from home page</h1>" + nav;

		if (viteDevServer) {
			html = await viteDevServer.transformIndexHtml(req.path, html);
		}

		return html;
	},
};

export default homeRoute;
