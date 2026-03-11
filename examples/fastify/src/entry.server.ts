import Fastify from "fastify";
import type { IncomingMessage, ServerResponse } from "node:http";

import homeRoute from "./routes/home";
import fooRoute from "./routes/foo";
import barRoute from "./routes/bar";

const fastify = Fastify({
	// Your Fastify options go here.
});

type AppInstanceType = typeof fastify;

// Export the route handler type to be used in route definitions
export type AppRouteHandler = Parameters<AppInstanceType["route"]>[0];

fastify.route(homeRoute);
fastify.route(fooRoute);
fastify.route(barRoute);

let fastifyReady = false;

// Default export a Connect-compatible handler for dev
export default async function handler(
	req: IncomingMessage,
	res: ServerResponse,
) {
	if (!fastifyReady) {
		await fastify.ready();
		fastifyReady = true;
	}

	fastify.server.emit("request", req, res);
}

if (import.meta.env.COMMAND === "build") {
	// Start the Fastify server in production mode
	fastify.listen({ port: 3000 }).then(() => {
		console.log("Server is running on http://localhost:3000");
	});
}

if (import.meta.hot) {
	import.meta.hot.accept();
}
