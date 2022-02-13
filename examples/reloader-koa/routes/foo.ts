import { Middleware } from "koa";
import viteDevServer from "@vavite/dev-server/server";
import nav from "./nav";

const fooRoute: Middleware = async (ctx, next) => {
	let html = "<h1>Hello from page /foo</h1>" + nav;

	if (import.meta.env.DEV) {
		html = await viteDevServer!.transformIndexHtml(ctx.url, html);
	}

	ctx.body = html;
};

export default fooRoute;
