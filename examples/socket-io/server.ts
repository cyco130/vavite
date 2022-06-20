/// <reference types="vite/client" />

import express, { RequestHandler } from "express";
import httpDevServer from "vavite/http-dev-server";
import viteDevServer from "vavite/vite-dev-server";
import { Server } from "socket.io";

const app = express();
const io = new Server();

app.get("/", async (req, res) => {
	res.sendFile(process.cwd() + "/view.html");
});

if (httpDevServer) {
	httpDevServer.on("request", app);
	io.attach(viteDevServer!.httpServer!);
} else {
	console.log("Starting prod server");
	const server = app.listen(3000);
	io.attach(server);
}

io.on("connection", (socket) => {
	socket.on("chat message", (msg) => {
		io.emit("chat message", msg);
	});
});
