import express from "express";
import httpDevServer from "vavite/http-dev-server";

const app = express();

app.get("/foo", (req, res) => {
	console.log("Here");
	res.send("foo");
});

export default app;

if (httpDevServer) {
	httpDevServer.on("request", app);
} else {
	console.log("Starting prod server");
	app.listen(3000);
}
