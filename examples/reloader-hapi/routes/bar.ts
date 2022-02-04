import { Lifecycle } from "@hapi/hapi";
import { transformIndexHtml } from "@vavite/dev-server-methods";
import nav from "./nav";

const barRoute: Lifecycle.Method = async (req, h) => {
	return transformIndexHtml(req.path, "<h1>Hello from page /bar</h1>" + nav);
};

export default barRoute;
