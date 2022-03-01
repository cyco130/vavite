import type { IncomingMessage, ServerResponse } from "http";

export default function handler(
	req: IncomingMessage,
	res: ServerResponse,
	next: () => void,
) {
	if (!res.writableEnded && req.url === "/") {
		res.setHeader("Content-Type", "text/html; charset=utf-8");
		// This is not Express, res.send is Express-specific.
		// So you should use res.write or res.end instead.
		res.end("<h1>Hello from standalone!</h1>");
	}

	next();
}
