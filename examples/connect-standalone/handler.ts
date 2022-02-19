import type { IncomingMessage, ServerResponse } from "http";

export default function handler(
	req: IncomingMessage,
	res: ServerResponse,
	next: () => void,
) {
	if (req.url === "/") {
		res.setHeader("Content-Type", "text/html; charset=utf-8");
		res.end("<h1>Hello from standalone!</h1>");
	} else {
		next();
	}
}
