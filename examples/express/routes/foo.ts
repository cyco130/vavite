import { RequestHandler } from "express";
import viteDevServer from "vavite/vite-dev-server";
import nav from "./nav";

const fooRoute: RequestHandler = async (req, res, next) => {
	let html = "<h1>Hello from page /foo</h1>" + nav;

	if (viteDevServer) {
		html = await viteDevServer.transformIndexHtml(req.url, html);
	}

	res.send(html);
};

export default fooRoute;
