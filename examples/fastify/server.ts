/// <reference types="vite/client" />

import Fastify, { RouteHandlerMethod } from "fastify";
import httpDevServer from "vavite/http-dev-server";
import viteDevServer from "vavite/vite-dev-server";
import { AddressInfo } from "net";

const fastify = Fastify({
	serverFactory: httpDevServer
		? (handler) => {
				httpDevServer!.on("request", handler);
				return httpDevServer!;
		  }
		: undefined,
});

// This is an optional optimization to load routes lazily so that
// when reloadOn option is set to "static-deps-change",
// changes to the route handlers will not trigger a reload.
// Feel free to remove this and import routes directly.
function lazy(
	importer: () => Promise<{ default: RouteHandlerMethod }>,
): RouteHandlerMethod {
	return async (req, res) => {
		try {
			const routeHandler = (await importer()).default;
			return routeHandler.bind(fastify)(req, res);
		} catch (err) {
			if (err instanceof Error) viteDevServer?.ssrFixStacktrace(err);
			throw err;
		}
	};
}

fastify.get(
	"/",
	lazy(() => import("./routes/home")),
);

fastify.get(
	"/foo",
	lazy(() => import("./routes/foo")),
);

fastify.get(
	"/bar",
	lazy(() => import("./routes/bar")),
);

if (httpDevServer) {
	// Fastify insists on calling listen itself.
	// devServer ignores listen calls but calls the callback.
	fastify.listen((httpDevServer.address() as AddressInfo).port, (err) => {
		if (err) throw err;
	});
} else {
	console.log("Starting prod server");

	fastify.listen(3000, (err) => {
		if (err) throw err;
	});
}
