import type { RequestHandler } from "express";
import nav from "./nav";

const homeRoute: RequestHandler = async (req, res) => {
	const html = "<h1>Hello from home page</h1>" + nav;

	res.send(html);
};

export default homeRoute;
