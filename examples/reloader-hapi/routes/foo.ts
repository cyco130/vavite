import { Lifecycle } from "@hapi/hapi";
import { transformIndexHtml } from "@vavite/dev-server-methods";
import nav from "./nav";

const fooRoute: Lifecycle.Method = async (req, h) => {
	return transformIndexHtml(req.path, "<h1>Hello from page /foo</h1>" + nav);
};

export default fooRoute;
