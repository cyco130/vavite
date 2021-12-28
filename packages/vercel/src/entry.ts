import userHandler from "@vavite/handler";

import type { IncomingMessage, ServerResponse } from "http";
import type { IncomingRequest, OutgoingResponse, RawResponse } from "vavite";

export default async function vercelHandler(
	req: IncomingMessage,
	res: ServerResponse,
) {
	try {
		function fwd(name: string) {
			return (String(req.headers["x-forwarded-" + name]) || "")
				.split(",", 1)[0]
				.trim();
		}

		const proto = fwd("proto");
		const host = fwd("host");
		const ip = fwd("for");

		const request = parseRequest(proto + ":" + host, ip, req, res);
		const response: undefined | OutgoingResponse | RawResponse =
			await userHandler(request);

		if (!response) {
			res.statusCode = 404;
			res.end("Not Found");
			return;
		}

		if ("raw" in response) {
			return;
		}

		res.statusCode = response.status || 200;

		for (const [key, value] of Object.entries(response.headers || {})) {
			if (value === undefined) continue;
			res.setHeader(key, value);
		}

		const { body } = response;

		if (!body || typeof body === "string" || body instanceof Uint8Array) {
			res.end(Buffer.from(body || ""));
			return;
		}

		for await (let chunk of body) {
			// TODO: Should we await for the drain event if it's full?
			if (typeof chunk !== "string") {
				chunk = Buffer.from(chunk);
			}
			res.write(chunk);
		}

		res.end();
	} catch (err) {
		console.error(err);
		res.statusCode = 500;
		res.end("Internal Server Error");
	}
}

function parseRequest(
	origin: string,
	ip: string,
	req: IncomingMessage,
	res: ServerResponse,
): IncomingRequest {
	const url = new URL(req.url || "/", origin);

	let headers: Record<string, string> = {};
	for (const [key, value] of Object.entries(req.headers)) {
		if (value === undefined) continue;
		headers[key] = Array.isArray(value) ? value.join(", ") : value;
	}

	return {
		raw: { req, res },
		ip,
		url,
		method: req.method || "GET",
		headers,
		body: {
			async *stream() {
				for await (const chunk of req) {
					yield new Uint8Array(chunk as Buffer);
				}
			},

			async text() {
				const chunks: string[] = [];

				req.setEncoding("utf8");
				for await (const chunk of req) {
					chunks.push(chunk);
				}

				return chunks.join("");
			},

			async binary() {
				const chunks: Buffer[] = [];

				for await (const chunk of req) {
					chunks.push(chunk);
				}

				return Buffer.concat(chunks);
			},
		},
	};
}
