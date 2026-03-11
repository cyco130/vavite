import nav from "./nav";
import type { AppRouteHandler } from "../entry.server";

const homeRoute: AppRouteHandler = {
	method: "GET",
	path: "/",
	async handler(req) {
		const html = "<h1>Hello from home page</h1>" + nav;

		return html;
	},
};

export default homeRoute;
