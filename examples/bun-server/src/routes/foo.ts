import nav from "./nav";

export default async function fooRoute(request: Request) {
	const html = "<h1>Hello from page /foo</h1>" + nav;

	return new Response(html, {
		headers: {
			"Content-Type": "text/html",
		},
	});
}
