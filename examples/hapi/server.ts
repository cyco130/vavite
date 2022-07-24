/// <reference types="vite/client" />
import Hapi, { Lifecycle } from "@hapi/hapi";
import devServer from "vavite/http-dev-server";
import viteDevServer from "vavite/vite-dev-server";
import { Server as TlsServer } from "tls";

// This is an optional optimization to load routes lazily so that
// when reloadOn option is set to "static-deps-change",
// changes to the route handlers will not trigger a reload.
// Feel free to remove this and import routes directly.
function lazy(
	importer: () => Promise<{ default: Lifecycle.Method }>,
): Lifecycle.Method {
	return async (req, h) => {
		try {
			const routeHandler = (await importer()).default;
			return routeHandler(req, h);
		} catch (err) {
			if (err instanceof Error) viteDevServer?.ssrFixStacktrace(err);
			throw err;
		}
	};
}

async function init() {
	let server: Hapi.Server;

	if (devServer) {
		server = Hapi.server({
			listener: devServer,
			autoListen: false,
			tls: devServer instanceof TlsServer,
		});
	} else {
		server = Hapi.server({
			port: 3000,
			host: "localhost",
		});
	}

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

	if (!devServer) {
		console.log("Starting prod server");
	}

	await server.start();
}

process.on("unhandledRejection", (err) => {
	console.log(err);
	process.exit(1);
});

init();
