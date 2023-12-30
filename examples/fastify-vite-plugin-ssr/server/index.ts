/// <reference types="vite/client" />

import viteDevServer from "vavite/http-dev-server";
import Fastify, { FastifyInstance } from "fastify";
import FastifyStatic from "@fastify/static";
import { renderPage } from "vike/server";
import { fileURLToPath } from "node:url";
import { IncomingMessage, ServerResponse } from "node:http";

async function startServer() {
	const instance = Fastify({});

	if (!viteDevServer) {
		await instance.register(FastifyStatic, {
			root: fileURLToPath(new URL("../client/assets", import.meta.url)),
			prefix: "/assets/",
		});
	}

	instance.get("*", async (request, reply) => {
		const pageContext = await renderPage({ urlOriginal: request.url });
		const { httpResponse } = pageContext;
		if (!httpResponse) return;

		const { statusCode, body } = httpResponse;

		reply
			.code(statusCode)
			.headers(httpResponse.headers)
			.type("text/html")
			.send(body);
	});

	await instance.ready();

	fastify = instance;
}

let fastify: FastifyInstance | undefined;
const fastifyHandlerPromise = startServer().catch((error) => {
	console.error(error);
	process.exit(1);
});

export default async function handler(
	request: IncomingMessage,
	reply: ServerResponse,
) {
	if (!fastify) {
		await fastifyHandlerPromise;
	}

	fastify!.server.emit("request", request, reply);
}
