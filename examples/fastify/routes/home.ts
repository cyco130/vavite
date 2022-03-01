import { RouteHandlerMethod } from "fastify";
import viteDevServer from "vavite/vite-dev-server";
import nav from "./nav";

const homeRoute: RouteHandlerMethod = async (req, res) => {
	let html = "<h1>Hello from home page</h1>" + nav;

	if (import.meta.env.DEV) {
		html = await viteDevServer!.transformIndexHtml(req.url, html);
	}

	res.type("text/html");
	res.send(html);
};

export default homeRoute;
