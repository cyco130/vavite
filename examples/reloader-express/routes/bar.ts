import { RequestHandler } from "express";
import nav from "./nav";

const barRoute: RequestHandler = (req, res, next) => {
	res.send("<h1>Hello from page /bar</h1>" + nav);
};

export default barRoute;
