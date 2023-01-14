/// <reference types="vite/client" />

import Fastify, { RouteHandlerMethod } from "fastify";
import viteDevServer from "vavite/vite-dev-server";
import { IncomingMessage, ServerResponse } from "http";

const fastify = Fastify({
	// Your Fastify options go here.
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

let fastifyReadyPromise: PromiseLike<void> | undefined = fastify.ready();

export default async function handler(
	request: IncomingMessage,
	reply: ServerResponse,
) {
	if (fastifyReadyPromise) {
		await fastifyReadyPromise;
		fastifyReadyPromise = undefined;
	}

	fastify.server.emit("request", request, reply);
}
