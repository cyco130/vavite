import nav from "./nav";
import type { AppRouteHandler } from "../entry.server";

const fooRoute: AppRouteHandler = {
	method: "GET",
	path: "/foo",
	async handler(req) {
		const html = "<h1>Hello from page /foo</h1>" + nav;

		return html;
	},
};

export default fooRoute;
