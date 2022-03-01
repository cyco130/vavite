/// <reference types="vite/client" />

import express from "express";
import { createPageRenderer } from "vite-plugin-ssr";
import httpDevServer from "vavite/http-dev-server";
import viteDevServer from "vavite/vite-dev-server";

startServer();

async function startServer() {
	const app = express();

	if (import.meta.env.PROD) {
		app.use(express.static("dist/client"));

		const IMPORT_BUILD_PATH = "./importBuild.js";
		await import(/* @vite-ignore */ IMPORT_BUILD_PATH);
	}

	const renderPage = createPageRenderer(
		import.meta.env.PROD
			? { isProduction: true }
			: { viteDevServer, root: "." },
	);

	app.get("*", async (req, res, next) => {
		const url = req.originalUrl;
		const pageContextInit = {
			url,
		};
		const pageContext = await renderPage(pageContextInit);
		const { httpResponse } = pageContext;
		if (!httpResponse) return next();
		const { statusCode, body } = httpResponse;
		res.status(statusCode).send(body);
	});

	if (import.meta.env.PROD) {
		const port = process.env.PORT || 3000;
		app.listen(port);
		console.log(`Server running at http://localhost:${port}`);
	} else {
		httpDevServer!.on("request", app);
	}
}
