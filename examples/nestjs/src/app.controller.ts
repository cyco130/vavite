import { Controller, Get, Req, Request } from "@nestjs/common";
import viteDevServer from "vavite/vite-dev-server";

@Controller()
export class AppController {
	@Get("/")
	async home(@Req() request: Request) {
		let html = "<h1>Hello from Nest.js</h1>" + nav;

		if (viteDevServer) {
			html = await viteDevServer.transformIndexHtml(request.url, html);
		}

		return html;
	}

	@Get("/foo")
	async foo(@Req() request: Request) {
		let html = "<h1>Hello from page /foo</h1>" + nav;

		if (viteDevServer) {
			html = await viteDevServer.transformIndexHtml(request.url, html);
		}

		return html;
	}

	@Get("/bar")
	async bar(@Req() request: Request) {
		let html = "<h1>Hello from page /bar</h1>" + nav;

		if (viteDevServer) {
			html = await viteDevServer.transformIndexHtml(request.url, html);
		}

		return html;
	}
}

const nav = `
	<nav>
		<ul>
			<li><a href="/">Home</a></li>
			<li><a href="/foo">Foo</a></li>
			<li><a href="/bar">Bar</a></li>
		</ul>
	</nav>
`;
