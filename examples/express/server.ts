/// <reference types="vite/client" />

import express, { RequestHandler } from "express";
import httpDevServer from "vavite/http-dev-server";
import viteDevServer from "vavite/vite-dev-server";

const app = express();

// This is an optional trick to load routes lazily so that
// when reloadOn option is set to "static-deps-change",
// changes to the route handlers will not trigger a reload.
function lazy(
	importer: () => Promise<{ default: RequestHandler }>,
): RequestHandler {
	return async (req, res, next) => {
		try {
			const routeHandler = (await importer()).default;
			routeHandler(req, res, next);
		} catch (err) {
			if (err instanceof Error) viteDevServer?.ssrFixStacktrace(err);
			next(err);
		}
	};
}

app.get(
	"/",
	lazy(() => import("./routes/home")),
);

app.get(
	"/foo",
	lazy(() => import("./routes/foo")),
);

app.get(
	"/bar",
	lazy(() => import("./routes/bar")),
);

if (httpDevServer) {
	httpDevServer.on("request", app);
} else {
	console.log("Starting prod server");
	app.listen(3000);
}
