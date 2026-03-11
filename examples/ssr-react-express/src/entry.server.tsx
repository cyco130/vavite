import express, { type Request, type Response } from "express";
import viteDevServer from "vavite:vite-dev-server";
import type { ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App";
import fs from "node:fs";
import Home from "./pages/Home";
import Foo from "./pages/Foo";
import Bar from "./pages/Bar";
import type { Manifest } from "vite";

// Read the client manifest in production to figure out the path to the client entry file
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

// Page routes
app.get("/", (req, res) => render(req, res, Home));
app.get("/foo", (req, res) => render(req, res, Foo));
app.get("/bar", (req, res) => render(req, res, Bar));

async function render(req: Request, res: Response, Page: ComponentType) {
	let clientEntryPath: string;
	if (import.meta.env.COMMAND === "build") {
		// In production we'll figure out the path to the client entry file using the manifest
		clientEntryPath = manifest!["src/entry.client.tsx"]!.file;

		// In a real application we would also use the manifest to generate
		// preload links for assets needed for the rendered page
	} else {
		// In development, we can simply refer to the source file name
		clientEntryPath = "/src/entry.client.tsx";
	}

	let html = `<!DOCTYPE html><html lang="en">
		<head>
			<meta charset="UTF-8">
			<title>SSR React Express</title>
		</head>
		<body>
			<div id="root">${renderToString(
				<App>
					<Page />
				</App>,
			)}</div>
			<script type="module" src="${clientEntryPath}"></script>
		</body>
	</html>`;

	if (viteDevServer) {
		// This will inject the Vite client and React fast refresh in development
		html = await viteDevServer.transformIndexHtml(req.url, html);
	}

	res.send(html);
}

export default app;

if (import.meta.env.COMMAND === "build") {
	app.listen(3000, () => {
		console.log("Server is running on http://localhost:3000");
	});
}

if (import.meta.hot) {
	import.meta.hot.accept();
}
