import { RequestHandler } from "express";
import nav from "./nav";

const fooRoute: RequestHandler = (req, res, next) => {
	res.send("<h1>Hello from page /foo</h1>" + nav);
};

export default fooRoute;
