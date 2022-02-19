/// <reference types="vite/client" />

import express from "express";
import handler from "./handler";

const app = express();

app.use(handler);

app.get("/express", (_, res) => {
	res.send("Hello from Express!");
});

app.listen(3000, () => {
	console.log("Listening on http://localhost:3000");
});
