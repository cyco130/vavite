import type { RequestHandler } from "express";
import nav from "./nav";

const fooRoute: RequestHandler = async (req, res) => {
	const html = "<h1>Hello from page /foo</h1>" + nav;

	res.send(html);
};

export default fooRoute;
