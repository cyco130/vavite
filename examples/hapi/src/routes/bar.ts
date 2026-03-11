import nav from "./nav";
import type { AppRouteHandler } from "../entry.server";

const barRoute: AppRouteHandler = {
	method: "GET",
	path: "/bar",
	async handler(req) {
		const html = "<h1>Hello from page /bar</h1>" + nav;

		return html;
	},
};

export default barRoute;
