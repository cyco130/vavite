import express from "express";

import homeRoute from "./routes/home";
import fooRoute from "./routes/foo";
import barRoute from "./routes/bar";

const app = express();

app.get("/", homeRoute);
app.get("/foo", fooRoute);
app.get("/bar", barRoute);

// Default export a Connect-compatible handler for dev
export default app;

if (import.meta.env.COMMAND === "build") {
	// Start the Express server in production mode
	app.listen(3000, () => {
		console.log("Server is running on http://localhost:3000");
	});
}

if (import.meta.hot) {
	import.meta.hot.accept();
}
