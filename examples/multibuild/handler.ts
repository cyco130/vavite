/// <reference types="vite/client" />

import type { IncomingMessage, ServerResponse } from "http";
import viteDevServer from "@vavite/dev-server/server";

// This is a simple hack to avoid loading the manifest in development (where it doesn't exist).
let manifest: Promise<any>;
if (import.meta.env.PROD) {
	// @ts-expect-error: This is only available during build.
	manifest = import("./dist/client/manifest.json").then((m) => m.default);
}

export default async function handler(
	req: IncomingMessage,
	res: ServerResponse,
	next: () => void,
) {
	if (req.url !== "/" || res.writableEnded) {
		next();
		return;
	}

	let clientFileName = "client.ts";

	if (import.meta.env.PROD) {
		const resolvedManifest = await manifest;
		clientFileName = resolvedManifest[clientFileName].file;
	} else {
		clientFileName = "/" + clientFileName;
	}

	let html = `<!DOCTYPE html>
		<html>
			<head>
				<meta charset="utf-8" />
				<title>Vite MultiBuild Example</title>
			</head>
			<body>
				<h1>Vite MultiBuild Example</h1>
				<div id="app"></div>
				<script type="module" src=${clientFileName}></script>
			</body>
		</html>
	`;

	if (viteDevServer) {
		html = await viteDevServer.transformIndexHtml("/", html);
	}

	res.setHeader("Content-Type", "text/html; charset=utf-8");
	res.end(html);
}
