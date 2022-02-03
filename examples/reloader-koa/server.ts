import Koa, { Middleware } from "koa";
import Router from "@koa/router";
import devServer from "@vavite/reloader/dev-server";
import { fixStacktrace } from "@vavite/dev-server-methods";

const app = new Koa();
const router = new Router();

function lazy(importer: () => Promise<{ default: Middleware }>): Middleware {
	return async (ctx, next) => {
		try {
			const routeHandler = (await importer()).default;
			return routeHandler(ctx, next);
		} catch (err) {
			if (err instanceof Error) fixStacktrace(err);
			throw err;
		}
	};
}

// When reloadOn option is set to "static-deps-change",
// changes to the route handlers will not trigger a reload.
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

if (devServer) {
	devServer.on("request", app.callback());
} else {
	console.log("Starting prod server");
	app.listen(3000);
}
