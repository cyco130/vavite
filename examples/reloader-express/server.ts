///<reference types="vite/client" />

import express, { RequestHandler } from "express";
import devServer from "@vavite/reloader/dev-server";
import viteDevServer from "@vavite/dev-server/server";

const app = express();

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

// When reloadOn option is set to "static-deps-change",
// changes to the route handlers will not trigger a reload.
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

if (devServer) {
	devServer.on("request", app);
} else {
	console.log("Starting prod server");
	app.listen(3000);
}
