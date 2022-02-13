import { Lifecycle } from "@hapi/hapi";
import viteDevServer from "@vavite/dev-server/server";
import nav from "./nav";

const homeRoute: Lifecycle.Method = async (req, h) => {
	let html = "<h1>Hello from home page</h1>" + nav;

	if (import.meta.env.DEV) {
		html = await viteDevServer!.transformIndexHtml(req.path, html);
	}

	return html;
};

export default homeRoute;
