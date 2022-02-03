import { Middleware } from "koa";
import { transformIndexHtml } from "@vavite/dev-server-methods";
import nav from "./nav";

const fooRoute: Middleware = async (ctx, next) => {
	ctx.body = await transformIndexHtml(
		ctx.url,
		"<h1>Hello from page /foo</h1>" + nav,
	);
};

export default fooRoute;
