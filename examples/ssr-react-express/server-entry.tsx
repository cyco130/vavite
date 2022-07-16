/// <reference types="vite/client" />

import express, { Request, Response } from "express";
import httpDevServer from "vavite/http-dev-server";
import viteDevServer from "vavite/vite-dev-server";
import { ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App";

const app = express();

if (import.meta.env.PROD) {
	// Serve client assets in production
	app.use(express.static("dist/client"));
}

// Page routes
app.get("/", (req, res) => render(req, res, () => import("./pages/Home")));
app.get("/foo", (req, res) => render(req, res, () => import("./pages/Foo")));
app.get("/bar", (req, res) => render(req, res, () => import("./pages/Bar")));

type PageImporter = () => Promise<{ default: ComponentType }>;

async function render(req: Request, res: Response, importer: PageImporter) {
	const Page = (await importer()).default;

	let clientEntryPath: string;
	if (import.meta.env.DEV) {
		// In development, we can simply refer to the source file name
		clientEntryPath = "/client-entry.tsx";
	} else {
		// In production we'll figure out the path to the client entry file using the manifest
		// @ts-expect-error: This only exists after the client build is complete
		const manifest = (await import("./dist/client/manifest.json")).default;
		clientEntryPath = manifest["client-entry.tsx"].file;

		// In a real application we would also use the manifest to generate
		// preload links for assets needed for the rendered page
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

	if (import.meta.env.DEV) {
		// This will inject the Vite client and React fast refresh in development
		html = await viteDevServer!.transformIndexHtml(req.url, html);
	}

	res.send(html);
}

if (import.meta.env.DEV) {
	httpDevServer!.on("request", app);
} else {
	console.log("Starting production server");
	app.listen(3000);
}
