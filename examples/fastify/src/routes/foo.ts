import viteDevServer from "vavite:vite-dev-server";
import nav from "./nav";
import type { AppRouteHandler } from "../entry.server";

const fooRoute: AppRouteHandler = {
	method: "GET",
	url: "/foo",
	async handler(req, res) {
		let html = "<h1>Hello from page /foo</h1>" + nav;

		if (viteDevServer) {
			html = await viteDevServer.transformIndexHtml(req.url, html);
		}

		res.type("text/html");
		res.send(html);
	},
};

export default fooRoute;
