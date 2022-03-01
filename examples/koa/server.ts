/// <reference types="vite/client" />

import Koa, { Middleware } from "koa";
import Router from "@koa/router";
import httpDevServer from "vavite/http-dev-server";
import viteDevServer from "vavite/vite-dev-server";

const app = new Koa();
const router = new Router();

// This is an optional trick to load routes lazily so that
// when reloadOn option is set to "static-deps-change",
// changes to the route handlers will not trigger a reload.
function lazy(importer: () => Promise<{ default: Middleware }>): Middleware {
	return async (ctx, next) => {
		try {
			const routeHandler = (await importer()).default;
			return routeHandler(ctx, next);
		} catch (err) {
			if (err instanceof Error) viteDevServer?.ssrFixStacktrace(err);
			throw err;
		}
	};
}

router.get(
	"/",
	lazy(() => import("./routes/home")),
);

router.get(
	"/foo",
	lazy(() => import("./routes/foo")),
);

router.get(
	"/bar",
	lazy(() => import("./routes/bar")),
);

app.use(router.routes());

if (httpDevServer) {
	httpDevServer.on("request", app.callback());
} else {
	console.log("Starting prod server");
	app.listen(3000);
}
