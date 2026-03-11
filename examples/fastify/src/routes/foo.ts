import nav from "./nav";
import type { AppRouteHandler } from "../entry.server";

const fooRoute: AppRouteHandler = {
	method: "GET",
	url: "/foo",
	async handler(req, res) {
		const html = "<h1>Hello from page /foo</h1>" + nav;

		res.type("text/html");
		res.send(html);
	},
};

export default fooRoute;
