import { Lifecycle } from "@hapi/hapi";
import { transformIndexHtml } from "@vavite/dev-server-methods";
import nav from "./nav";

const homeRoute: Lifecycle.Method = async (req, h) => {
	return transformIndexHtml(req.path, "<h1>Hello from home page</h1>" + nav);
};

export default homeRoute;
