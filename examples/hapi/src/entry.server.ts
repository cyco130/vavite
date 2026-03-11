import Hapi from "@hapi/hapi";
import type { IncomingMessage, ServerResponse } from "node:http";

import homeRoute from "./routes/home";
import fooRoute from "./routes/foo";
import barRoute from "./routes/bar";

const server = Hapi.server({
	autoListen: import.meta.env.COMMAND === "build",
	port: import.meta.env.COMMAND === "build" ? 3000 : undefined,
});

type AppInstanceType = typeof server;

// Export the route handler type to be used in route definitions
export type AppRouteHandler = Parameters<AppInstanceType["route"]>[0];

server.route(homeRoute);
server.route(fooRoute);
server.route(barRoute);

let serverStarted = false;

// Default export a Connect-compatible handler for dev
export default async function handler(
	req: IncomingMessage,
	res: ServerResponse,
) {
	if (!serverStarted) {
		await server.initialize();
		serverStarted = true;
	}

	server.listener.emit("request", req, res);
}

if (import.meta.env.COMMAND === "build") {
	// Start the Hapi server in production mode
	server.start().then(() => {
		console.log("Server is running on http://localhost:3000");
	});
}

if (import.meta.hot) {
	import.meta.hot.accept();
}
