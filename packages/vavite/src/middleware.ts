import { IncomingMessage, ServerResponse } from "http";
import sirv from "sirv";
import { parseRequest } from "./node-helpers";
import { OutgoingResponse, RawResponse } from ".";

// @ts-ignore
import handler from "vavite/handler";

export interface VaviteMiddlewareOptions {
	trustProxy?: boolean;
	defaultHost?: string;
}

export function createMiddleware({
	trustProxy,
	defaultHost,
}: VaviteMiddlewareOptions) {
	return async function vaviteMiddleware(
		req: IncomingMessage,
		res: ServerResponse,
		next: () => void,
	) {
		try {
			function fwd(name: string) {
				return (String(req.headers["x-forwarded-" + name]) || "")
					.split(",", 1)[0]
					.trim();
			}

			const proto = trustProxy ? fwd("proto") : "http";
			const host = trustProxy
				? fwd("host")
				: req.headers.host || defaultHost || "localost";
			const ip = trustProxy ? fwd("for") : req.socket.remoteAddress || "";

			const request = parseRequest(proto + ":" + host, ip, req, res);
			const response: undefined | OutgoingResponse | RawResponse =
				await handler(request);

			if (!response) {
				next();
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
	};
}
