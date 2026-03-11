import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
} from "node:http";
import { resource1 } from "./cleanup-on-dispose";
import { resource2 } from "./reuse";

// Default export a Connect-compatible handler for dev
export default function handler(req: IncomingMessage, res: ServerResponse) {
	if (req.url === "/") {
		res.setHeader("Content-Type", "text/html; charset=utf-8");
		res.end(`<code><pre>${resource1.message}</pre></code>`);
	} else if (req.url === "/reuse") {
		res.setHeader("Content-Type", "text/html; charset=utf-8");
		res.end(`<code><pre>${resource2.message}</pre></code>`);
	} else {
		res.statusCode = 404;
		res.end("Not found");
	}
}

if (import.meta.env.COMMAND === "build") {
	// Start the standalone server in production mode
	createServer(handler).listen(3000, () => {
		console.log("Server is listening on http://localhost:3000");
	});
}

if (import.meta.hot) {
	import.meta.hot.accept();
}
