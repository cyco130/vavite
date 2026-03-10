import viteDevServer from "vavite:vite-dev-server";
import nav from "./nav";
import type { AppRouteHandler } from "../entry.server";

const fooRoute: AppRouteHandler = {
	method: "GET",
	path: "/foo",
	async handler(req) {
		let html = "<h1>Hello from page /foo</h1>" + nav;

		if (viteDevServer) {
			html = await viteDevServer.transformIndexHtml(req.path, html);
		}

		return html;
	},
};

export default fooRoute;
