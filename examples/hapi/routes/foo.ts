import { Lifecycle } from "@hapi/hapi";
import viteDevServer from "vavite/vite-dev-server";
import nav from "./nav";

const fooRoute: Lifecycle.Method = async (req, h) => {
	let html = "<h1>Hello from page /foo</h1>" + nav;

	if (import.meta.env.DEV) {
		html = await viteDevServer!.transformIndexHtml(req.path, html);
	}

	return html;
};

export default fooRoute;
