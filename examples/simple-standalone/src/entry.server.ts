import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
} from "node:http";

// Default export a Connect-compatible handler for dev
export default function handler(req: IncomingMessage, res: ServerResponse) {
	if (req.url === "/") {
		res.setHeader("Content-Type", "text/html; charset=utf-8");
		// This is not Express, res.send is Express-specific.
		// So you should use res.write or res.end instead.
		res.end("<h1>Hello from standalone!</h1>");
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
