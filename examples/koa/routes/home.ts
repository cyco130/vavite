import { Middleware } from "koa";
import viteDevServer from "vavite/vite-dev-server";
import nav from "./nav";

const homeRoute: Middleware = async (ctx, next) => {
	let html = "<h1>Hello from home page</h1>" + nav;

	if (viteDevServer) {
		html = await viteDevServer.transformIndexHtml(ctx.url, html);
	}

	ctx.body = html;
};

export default homeRoute;
