import { RequestHandler } from "express";
import nav from "./nav";

const homeRoute: RequestHandler = (req, res, next) => {
	res.send("<h1>Hello from home page</h1>" + nav);
};

export default homeRoute;
