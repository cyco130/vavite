import type { Middleware } from "koa";
import nav from "./nav";

const homeRoute: Middleware = async (ctx, next) => {
	const html = "<h1>Hello from home page</h1>" + nav;

	ctx.body = html;
};

export default homeRoute;
