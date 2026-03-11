import nav from "./nav";

export default async function barRoute(request: Request) {
	const html = "<h1>Hello from page /bar</h1>" + nav;

	return new Response(html, {
		headers: {
			"Content-Type": "text/html",
		},
	});
}
