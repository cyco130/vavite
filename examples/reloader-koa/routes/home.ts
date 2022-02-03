import { Middleware } from "koa";
import { transformIndexHtml } from "@vavite/dev-server-methods";
import nav from "./nav";

const homeRoute: Middleware = async (ctx, next) => {
	ctx.body = await transformIndexHtml(
		ctx.url,
		"<h1>Hello from home page</h1>" + nav,
	);
};

export default homeRoute;
