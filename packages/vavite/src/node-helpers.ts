import type { IncomingMessage, ServerResponse } from "http";
import { IncomingRequest } from ".";

export function parseRequest(
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
