import express from "express";
import type { Duplex } from "node:stream";
import viteDevServer from "vavite:vite-dev-server";
import type { Manifest } from "vite";
import { WebSocketServer } from "ws";
import fs from "node:fs";
import type { IncomingMessage } from "node:http";

const manifest: Manifest | null =
	import.meta.env.COMMAND === "build"
		? // Assuming current directory is the project root
			JSON.parse(fs.readFileSync("./dist/client/.vite/manifest.json", "utf-8"))
		: null;

const app = express();

if (import.meta.env.COMMAND === "build") {
	// Serve client assets in production
	app.use(express.static("dist/client"));
}

app.get("/", async (req, res) => {
	let clientEntryPath: string;
	if (import.meta.env.COMMAND === "build") {
		clientEntryPath = manifest!["src/entry.client.ts"]!.file;
	} else {
		clientEntryPath = "/src/entry.client.ts";
	}

	let html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>WebSocket Example</title>
</head>
<body>
	<h1>WebSocket Example</h1>
	<script type="module" src="${clientEntryPath}"></script>
</body>
</html>
`;

	if (viteDevServer) {
		html = await viteDevServer.transformIndexHtml(req.url, html);
	}

	res.setHeader("Content-Type", "text/html; charset=utf-8");
	res.end(html);
});

export default app;

const wss = new WebSocketServer({
	noServer: true,
});

function upgradeHandler(req: IncomingMessage, socket: Duplex, head: Buffer) {
	if (req.url !== "/ws") {
		return;
	}

	console.log("Upgrading to WebSocket...");
	wss.handleUpgrade(req, socket, head, (ws) => {
		wss.emit("connection", ws, req);
	});
}

wss.on("connection", (ws) => {
	console.log("WebSocket connection established!");

	ws.on("message", (message) => {
		console.log("Received message:", message.toString());
		ws.send(`Echo: ${message}`);
	});
});

if (import.meta.env.COMMAND === "build") {
	// Start the standalone server in production mode
	const server = app.listen(3000, () => {
		console.log("Server is listening on http://localhost:3000");
	});

	// Attach to the producton server
	server.on("upgrade", upgradeHandler);
} else {
	// Attach to the Vite dev server
	viteDevServer?.httpServer?.on("upgrade", upgradeHandler);
}

if (import.meta.hot) {
	import.meta.hot.accept();

	import.meta.hot.dispose(() => {
		console.log("Disposing WebSocket server...");
		viteDevServer!.httpServer!.off("upgrade", upgradeHandler);
		wss.close();
		wss.clients.forEach((client) => client.close());
	});
}
