import Koa from "koa";
import Router from "@koa/router";
import homeRoute from "./routes/home";
import fooRoute from "./routes/foo";
import barRoute from "./routes/bar";

const app = new Koa({
	// Your Koa options go here.
});

const router = new Router({
	// Your Router options go here.
});

router.get("/", homeRoute);
router.get("/foo", fooRoute);
router.get("/bar", barRoute);

app.use(router.routes());

// Default export a Connect-compatible handler for dev
export default app.callback();

if (import.meta.env.COMMAND === "build") {
	// Start the Koa server in production mode
	app.listen(3000, () => {
		console.log("Server is running on http://localhost:3000");
	});
}

if (import.meta.hot) {
	import.meta.hot.accept();
}
