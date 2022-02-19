import { Middleware } from "koa";
import viteDevServer from "@vavite/expose-vite-dev-server/vite-dev-server";
import nav from "./nav";

const homeRoute: Middleware = async (ctx, next) => {
	let html = "<h1>Hello from home page</h1>" + nav;

	if (import.meta.env.DEV) {
		html = await viteDevServer!.transformIndexHtml(ctx.url, html);
	}

	ctx.body = html;
};

export default homeRoute;
