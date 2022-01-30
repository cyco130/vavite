const express = require("express");
const handler = require("./dist").default;

const app = express();

app.use(handler);

app.get("/express", (_, res) => {
	res.send("Hello from Express!");
});

app.listen(3000, () => {
	console.log("Listening on http://localhost:3000");
});
