import { Middleware } from "koa";
import { transformIndexHtml } from "@vavite/dev-server-methods";
import nav from "./nav";

const barRoute: Middleware = async (ctx, next) => {
	ctx.body = await transformIndexHtml(
		ctx.url,
		"<h1>Hello from page /bar</h1>" + nav,
	);
};

export default barRoute;
