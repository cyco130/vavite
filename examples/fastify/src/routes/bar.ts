import nav from "./nav";
import type { AppRouteHandler } from "../entry.server";

const barRoute: AppRouteHandler = {
	method: "GET",
	url: "/bar",
	async handler(req, res) {
		const html = "<h1>Hello from page /bar</h1>" + nav;

		res.type("text/html");
		res.send(html);
	},
};

export default barRoute;
