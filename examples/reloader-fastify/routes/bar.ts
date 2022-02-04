import { RouteHandlerMethod } from "fastify";
import { transformIndexHtml } from "@vavite/dev-server-methods";
import nav from "./nav";

const barRoute: RouteHandlerMethod = async (req, res) => {
	res.type("text/html");
	res.send(
		await transformIndexHtml(req.url, "<h1>Hello from page /bar</h1>" + nav),
	);
};

export default barRoute;
