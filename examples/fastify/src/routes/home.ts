import nav from "./nav";
import type { AppRouteHandler } from "../entry.server";

const homeRoute: AppRouteHandler = {
	method: "GET",
	url: "/",
	async handler(req, res) {
		const html = "<h1>Hello from home page</h1>" + nav;

		res.type("text/html");
		res.send(html);
	},
};

export default homeRoute;
