import { RouteHandlerMethod } from "fastify";
import viteDevServer from "@vavite/dev-server/server";
import nav from "./nav";

const barRoute: RouteHandlerMethod = async (req, res) => {
	let html = "<h1>Hello from page /bar</h1>" + nav;

	if (import.meta.env.DEV) {
		html = await viteDevServer!.transformIndexHtml(req.url, html);
	}

	res.type("text/html");
	res.send(html);
};

export default barRoute;
