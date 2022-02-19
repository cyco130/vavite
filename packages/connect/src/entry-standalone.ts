import { createServer } from "http";
// @ts-expect-error: This is a virtual module
// eslint-disable-next-line import/no-unresolved
import handler from "/virtual:vavite-connect-handler";

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "localhost";

createServer((req, res) =>
	handler(req, res, () => {
		if (!res.writableEnded) {
			res.statusCode = 404;
			res.end();
		}
	}),
).listen(PORT, HOST, () => {
	// eslint-disable-next-line no-console
	console.log(`Server listening on http://${HOST}:${PORT}`);
});
