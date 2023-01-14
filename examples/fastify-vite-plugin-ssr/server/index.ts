/// <reference types="vite/client" />

import viteDevServer from "vavite/http-dev-server";
import Fastify, { FastifyInstance } from "fastify";
import FastifyStatic from "@fastify/static";
import { AddressInfo } from "net";
import { renderPage } from "vite-plugin-ssr";
import { fileURLToPath } from "url";
import { IncomingMessage, ServerResponse } from "http";

startServer();

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

		const { statusCode, body, contentType } = httpResponse;
		reply.code(statusCode).type(contentType).send(body);
	});

	if (viteDevServer) {
		fastifyHandlerPromise = instance.ready().then(() => {
			fastify = instance;
		});
	} else {
		console.log("Starting prod server");
		instance.listen({ port: 3000 }).catch((err) => {
			console.error(err);
			process.exit(1);
		});
	}
}

let fastify: FastifyInstance | undefined;
let fastifyHandlerPromise: PromiseLike<void>;

export default async function handler(
	request: IncomingMessage,
	reply: ServerResponse,
) {
	if (!fastify) {
		await fastifyHandlerPromise;
	}

	fastify!.server.emit("request", request, reply);
}
