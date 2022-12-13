/// <reference types="vite/client" />

import express, { Request, Response } from "express";
import httpDevServer from "vavite/http-dev-server";
import viteDevServer from "vavite/vite-dev-server";
import Vue, { createSSRApp, h, defineComponent } from "vue";
import { renderToString } from "vue/server-renderer";
import App from "./App.vue";

const app = express();

if (import.meta.env.PROD) {
	// Serve client assets in production
	app.use(express.static("dist/client"));
}

// Page routes
app.get("/", (req, res) => render(req, res, () => import("./pages/Home.vue")));
app.get("/foo", (req, res) =>
	render(req, res, () => import("./pages/Foo.vue")),
);
app.get("/bar", (req, res) =>
	render(req, res, () => import("./pages/Bar.vue")),
);

type PageImporter = () => Promise<{ default: any }>;

async function render(req: Request, res: Response, importer: PageImporter) {
	const Page = (await importer()).default;

	let clientEntryPath: string;
	if (viteDevServer) {
		// In development, we can simply refer to the source file name
		clientEntryPath = "/client-entry.ts";
	} else {
		// In production we'll figure out the path to the client entry file using the manifest
		// @ts-expect-error: This only exists after the client build is complete
		const manifest = (await import("./dist/client/manifest.json")).default;
		clientEntryPath = manifest["client-entry.ts"].file;

		// In a real application we would also use the manifest to generate
		// preload links for assets needed for the rendered page
	}

	const Content = defineComponent({
		render() {
			return h(
				App,
				{},
				{
					default() {
						return h(Page, {});
					},
				},
			);
		},
	});

	const content = await renderToString(createSSRApp(Content));

	let html = `<!DOCTYPE html><html lang="en">
		<head>
			<meta charset="UTF-8">
			<title>SSR Vue Express</title>
		</head>
		<body>
			<div id="root">${content}</div>
			<script type="module" src="${clientEntryPath}"></script>
		</body>
	</html>`;

	if (viteDevServer) {
		// This will inject the Vite client and React fast refresh in development
		html = await viteDevServer.transformIndexHtml(req.url, html);
	}

	res.send(html);
}

if (viteDevServer) {
	httpDevServer!.on("request", app);
} else {
	console.log("Starting production server");
	app.listen(3000);
}
