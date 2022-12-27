/// <reference types="vite/client" />

import httpDevServer from "vavite/http-dev-server";
import Fastify from "fastify";
import FastifyStatic from "@fastify/static";
import { AddressInfo } from "net";
import { renderPage } from "vite-plugin-ssr";
import { fileURLToPath } from "url";

startServer();

async function startServer() {
	const fastify = Fastify({
		serverFactory: httpDevServer
			? (handler) => {
					httpDevServer!.on("request", handler);
					return httpDevServer!;
			  }
			: undefined,
	});

	if (!httpDevServer) {
		await fastify.register(FastifyStatic, {
			root: fileURLToPath(new URL("../client/assets", import.meta.url)),
			prefix: "/assets/",
		});
	}

	fastify.get("*", async (request, reply) => {
		const pageContext = await renderPage({ urlOriginal: request.url });
		const { httpResponse } = pageContext;
		if (!httpResponse) return;

		const { statusCode, body, contentType } = httpResponse;
		reply.code(statusCode).type(contentType).send(body);
	});

	if (httpDevServer) {
		// Fastify insists on calling listen itself.
		// devServer ignores listen calls but calls the callback.
		fastify
			.listen({ port: (httpDevServer.address() as AddressInfo).port })
			.catch((err) => {
				console.error(err);
				process.exit(1);
			});
	} else {
		console.log("Starting prod server");
		fastify.listen({ port: 3000 }).catch((err) => {
			console.error(err);
			process.exit(1);
		});
	}
}
