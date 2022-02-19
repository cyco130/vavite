/// <reference types="vite/client" />

import Fastify, { RouteHandlerMethod } from "fastify";
import devServer from "@vavite/reloader/http-dev-server";
import viteDevServer from "@vavite/dev-server/server";
import { AddressInfo } from "net";

const fastify = Fastify({
	serverFactory: devServer
		? (handler) => {
				devServer!.on("request", handler);
				return devServer!;
		  }
		: undefined,
});

// This is an optional trick to load routes lazily so that
// when reloadOn option is set to "static-deps-change",
// changes to the route handlers will not trigger a reload.
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

if (devServer) {
	// Fastify insists on calling listen itself.
	// devServer ignores listen calls but calls the callback.
	fastify.listen((devServer.address() as AddressInfo).port, (err) => {
		if (err) throw err;
	});
} else {
	console.log("Starting prod server");

	fastify.listen(3000, (err) => {
		if (err) throw err;
	});
}
