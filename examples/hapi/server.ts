/// <reference types="vite/client" />

import Hapi, { Lifecycle } from "@hapi/hapi";
import viteDevServer from "vavite/vite-dev-server";
import { IncomingMessage, ServerResponse } from "http";

// This is an optional optimization to load routes lazily so that
// when reloadOn option is set to "static-deps-change",
// changes to the route handlers will not trigger a reload.
// Feel free to remove this and import routes directly.
function lazy(
	importer: () => Promise<{ default: Lifecycle.Method }>,
): Lifecycle.Method {
	return async function (req, h) {
		try {
			const routeHandler = (await importer()).default;
			return routeHandler.call(this, req, h);
		} catch (err) {
			if (err instanceof Error) viteDevServer?.ssrFixStacktrace(err);
			throw err;
		}
	};
}

let server: Hapi.Server;

server = Hapi.server({
	autoListen: false,
});

server.route({
	method: "GET",
	path: "/",
	handler: lazy(() => import("./routes/home")),
});

server.route({
	method: "GET",
	path: "/foo",
	handler: lazy(() => import("./routes/foo")),
});

server.route({
	method: "GET",
	path: "/bar",
	handler: lazy(() => import("./routes/bar")),
});

let promise: Promise<void> | undefined = server.start();

export default async function handler(
	req: IncomingMessage,
	res: ServerResponse,
) {
	if (promise) {
		await promise;
		promise = undefined;
	}

	server.listener.emit("request", req, res);
}
