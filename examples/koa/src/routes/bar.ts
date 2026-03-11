import type { Middleware } from "koa";
import nav from "./nav";

const barRoute: Middleware = async (ctx, next) => {
	const html = "<h1>Hello from page /bar</h1>" + nav;

	ctx.body = html;
};

export default barRoute;
