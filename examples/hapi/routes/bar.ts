import { Lifecycle } from "@hapi/hapi";
import viteDevServer from "vavite/vite-dev-server";
import nav from "./nav";

const barRoute: Lifecycle.Method = async function (req, h) {
	let html = "<h1>Hello from page /bar</h1>" + nav;

	if (viteDevServer) {
		html = await viteDevServer.transformIndexHtml(req.path, html);
	}

	return html;
};

export default barRoute;
