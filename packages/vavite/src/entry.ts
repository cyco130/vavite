import { createServer, ServerResponse } from "http";
import sirv from "sirv";
import { createMiddleware } from "./middleware";

const trustProxy = process.env.TRUST_PROXY === "1" || false;
const HOST = process.env.HOST || "localhost";
const PORT = Number(process.env.PORT) || 3000;

const fileServer = sirv("dist/client", { etag: true, maxAge: 0 });

const middleware = createMiddleware({
	trustProxy,
	defaultHost: HOST + ":" + PORT,
});

function notFound(res: ServerResponse) {
	res.statusCode = 404;
	res.end("Not Found");
}

const server = createServer((req, res) => {
	const { url = "/" } = req;
	const qIndex = url.indexOf("?");
	const pathname = qIndex !== -1 ? url.slice(0, qIndex) : url;

	if (pathname === "/") {
		middleware(req, res, () => notFound(res));
	} else {
		fileServer(req, res, () => middleware(req, res, () => notFound(res)));
	}
});

server.listen(PORT, HOST, () => {
	console.log(`Server listening on http://${HOST}:${PORT}`);
});
