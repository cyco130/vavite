/// <reference types="vite/client" />

import express from "express";
import { createPageRenderer } from "vite-plugin-ssr";
import httpServer from "@vavite/reloader/http-dev-server";
import viteDevServer from "@vavite/dev-server/server";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const root = import.meta.env.PROD
	? // We will be in <root>/dist/server in prod
	  `${__dirname}/../..`
	: // but in <root>/server in dev
	  `${__dirname}/..`;

startServer();

async function startServer() {
	const app = express();

	if (import.meta.env.PROD) {
		app.use(express.static(`${root}/dist/client`));
	}

	const renderPage = createPageRenderer({
		viteDevServer,
		isProduction: import.meta.env.PROD,
		root,
	});

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
		httpServer!.on("request", app);
	}
}
