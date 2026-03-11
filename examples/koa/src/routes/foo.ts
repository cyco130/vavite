import type { Middleware } from "koa";
import nav from "./nav";

const fooRoute: Middleware = async (ctx, next) => {
	const html = "<h1>Hello from page /foo</h1>" + nav;

	ctx.body = html;
};

export default fooRoute;
