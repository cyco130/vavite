import homeRoute from "./routes/home";
import fooRoute from "./routes/foo";
import barRoute from "./routes/bar";

const server = Bun.serve({
	port: process.env.PORT ? Number(process.env.PORT) : 3000,
	routes: {
		"/x": () => new Response("Hello from Bun!"),
		"/": homeRoute,
		"/foo": fooRoute,
		"/bar": barRoute,
	},
});

console.log(`Server is running at http://localhost:${server.port}`);

if (import.meta.hot) {
	import.meta.hot.accept();

	import.meta.hot.dispose(() => {
		server.stop();
	});
}
