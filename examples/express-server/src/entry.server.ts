import express from "express";

import homeRoute from "./routes/home";
import fooRoute from "./routes/foo";
import barRoute from "./routes/bar";

const app = express();

app.use((req, res, next) => {
	console.log(`${req.method} ${req.url}`);
	next();
});

app.get("/", homeRoute);
app.get("/foo", fooRoute);
app.get("/bar", barRoute);

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

console.log("Starting server...");
const server = app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});

if (import.meta.hot) {
	import.meta.hot.accept();

	import.meta.hot.dispose(() => {
		server.close();
	});
}
