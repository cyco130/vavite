import type { RequestHandler } from "express";
import nav from "./nav";

const barRoute: RequestHandler = async (req, res) => {
	const html = "<h1>Hello from page /bar</h1>" + nav;

	res.send(html);
};

export default barRoute;
