import { Controller, Get, Req } from "@nestjs/common";

@Controller()
export class AppController {
	@Get("/")
	async home(@Req() request: Request) {
		const html = "<h1>Hello from Nest.js</h1>" + nav;

		return html;
	}

	@Get("/foo")
	async foo(@Req() request: Request) {
		const html = "<h1>Hello from page /foo</h1>" + nav;

		return html;
	}

	@Get("/bar")
	async bar(@Req() request: Request) {
		const html = "<h1>Hello from page /bar</h1>" + nav;

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
