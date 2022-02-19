import { RouteHandlerMethod } from "fastify";
import viteDevServer from "@vavite/expose-vite-dev-server/vite-dev-server";
import nav from "./nav";

const fooRoute: RouteHandlerMethod = async (req, res) => {
	let html = "<h1>Hello from page /foo</h1>" + nav;

	if (import.meta.env.DEV) {
		html = await viteDevServer!.transformIndexHtml(req.url, html);
	}

	res.type("text/html");
	res.send(html);
};

export default fooRoute;
