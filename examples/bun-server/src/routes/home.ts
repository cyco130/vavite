import nav from "./nav";

export default async function homeRoute(request: Request) {
	const html = "<h1>Hello from home page</h1>" + nav;

	return new Response(html, {
		headers: {
			"Content-Type": "text/html",
		},
	});
}
