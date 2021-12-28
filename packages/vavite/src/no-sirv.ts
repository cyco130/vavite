import { createServer } from "http";
import { createMiddleware } from "./middleware";

const trustProxy = process.env.TRUST_PROXY === "1" || false;
const HOST = process.env.HOST || "localhost";
const PORT = Number(process.env.PORT) || 3000;

const middleware = createMiddleware({
	trustProxy,
	defaultHost: HOST + ":" + PORT,
});

const server = createServer((req, res) =>
	middleware(req, res, () => {
		res.statusCode = 404;
		res.end("Not Found");
	}),
);

server.listen(PORT, HOST, () => {
	console.log(`Server listening on http://${HOST}:${PORT}`);
});
