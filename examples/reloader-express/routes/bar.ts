import { RequestHandler } from "express";
import { transformIndexHtml } from "@vavite/dev-server-methods";
import nav from "./nav";

const barRoute: RequestHandler = async (req, res, next) => {
	res.send(
		await transformIndexHtml(req.url, "<h1>Hello from page /bar</h1>" + nav),
	);
};

export default barRoute;
