import { Lifecycle } from "@hapi/hapi";
import viteDevServer from "vavite/vite-dev-server";
import nav from "./nav";

const homeRoute: Lifecycle.Method = async (req, h) => {
	let html = "<h1>Hello from home page</h1>" + nav;

	if (viteDevServer) {
		html = await viteDevServer.transformIndexHtml(req.path, html);
	}

	return html;
};

export default homeRoute;
