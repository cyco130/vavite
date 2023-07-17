/// <reference types="vite/client" />

import express from "express";
import { Server as SocketIOServer } from "socket.io";
import type {} from "node:http";
import type {} from "node:net";

declare module "node:net" {
	interface Socket {
		server: import("node:http").Server;
	}
}

declare module "node:http" {
	interface Server {
		io?: SocketIOServer;
	}
}

const app = express();

let io: SocketIOServer;

app.use((req, res, next) => {
	if (!io || io !== req.socket.server.io) {
		req.socket.server.io?.close();

		io = req.socket.server.io = new SocketIOServer(req.socket.server);

		io.on("connection", (socket) => {
			socket.on("chat message", (msg) => {
				io.emit("chat message", msg);
			});
		});
	}

	next();
});

app.get("/", async (req, res) => {
	res.sendFile(process.cwd() + "/view.html");
});

export default app;
