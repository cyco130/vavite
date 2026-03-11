import viteDevServer from "vavite:vite-dev-server";
import nav from "./nav";

export default async function barRoute(request: Request) {
	let html = "<h1>Hello from page /bar</h1>" + nav;

	if (viteDevServer) {
		html = await viteDevServer.transformIndexHtml(request.url, html);
	}

	return new Response(html, {
		headers: {
			"Content-Type": "text/html",
		},
	});
}
