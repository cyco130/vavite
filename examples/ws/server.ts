/// <reference types="vite/client" />

import express from "express";
import { WebSocketServer } from "ws";
import type { Server, IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import html from "./index.html?raw";

const app = express();

// Since we don't have access to the server instance, we will lazily add the
// upgrade listener on the first request in the following middleware.
// This is fine for dev since our server code won't run until the first request.
// If it is unacceptable for prod, you can provide a custom server entry and
// add the upgrade listener there (and guard this code with an environment check).
let isFirstRequest = true;
app.use((req, _res, next) => {
	if (!isFirstRequest) {
		next();
		return;
	}
	isFirstRequest = false;

	// Types are missing but the server instance can be accessed via the socket.
	const server: Server = (req.socket as any).server;

	// Vite can reload the server file on changes, so we need to remove the
	// previous upgrade listener before adding a new one to avoid multiple
	// listeners. We save the previous listener on the global object so that
	// it survives reloads.
	if ((global as any).__previousUpgradeListener) {
		app.off("upgrade", (global as any).__previousUpgradeListener);
	}

	// Reuse the WebSocket server instance after reload if it already exists.
	const wss: WebSocketServer =
		(global as any).__previousWss || new WebSocketServer({ noServer: true });
	(global as any).__previousWss = wss;

	function upgradeListener(req: IncomingMessage, socket: Duplex, head: Buffer) {
		// Vite uses the / path for HMR so we need to use some other path for our
		// WebSocket server.
		if (req.url !== "/ws") return;

		wss.handleUpgrade(req, socket, head, (ws) => {
			ws.emit("connection", ws, req);

			ws.on("message", (message) => {
				console.log(`Received message: ${message}`);
				// Echo the message back to the client.
				ws.send(`Hello, you sent: ${message}`);
			});
		});
	}

	// Add the upgrade listener to the server.
	server.on("upgrade", upgradeListener);

	// Save the upgrade listener so we can remove it later.
	(global as any).__previousUpgradeListener = upgradeListener;
	(global as any).__previousWss = wss;

	next();
});

app.get("/", (_req, res) => {
	res.send(html);
});

export default app;
