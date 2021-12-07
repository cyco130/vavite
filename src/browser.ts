import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer, IncomingMessage } from "http";
import puppeteer from "puppeteer-core";
import { cpus } from "os";
import { red, green, white } from "kleur/colors";
import { underline } from "kleur";
import which from "which";

interface Options {
	browser: "chrome" | "firefox";
	executablePath?: string;
	headless: boolean;
}

export async function main(files: string[], options: Options) {
	const viteServer = await createViteServer({
		server: { hmr: false, middlewareMode: "ssr" },
		optimizeDeps: { entries: files },
	});

	const file = path.resolve(process.argv[2]);
	let currentIndex = 0;

	if (!options.executablePath) {
		options.executablePath = await which(
			options.browser === "chrome" ? "google-chrome" : "firefox",
		);
	}

	const browser = await puppeteer.launch({
		product: options.browser,
		executablePath: options.executablePath,
		headless: options.headless,
	});

	const runnerCode = await fs.promises.readFile(
		path.resolve(__dirname, "browser-runner.mjs"),
	);

	let workerCount = Math.min(files.length, cpus().length);
	let failed = false;

	const httpServer = createHttpServer((req, res) => {
		viteServer.middlewares(req, res, async () => {
			if (req.url?.startsWith("/vavite/page/")) {
				let html = await viteServer.transformIndexHtml(req.url, htmlTemplate);
				html = html.replace(
					"<!-- test scripts -->",
					`<script type="module" src=${JSON.stringify(
						encodeURI(file),
					)}></script>`,
				);

				res.setHeader("content-type", "text/html");
				res.end(html);
			} else if (req.url === "/vavite-browser-runner.mjs") {
				res.setHeader("content-type", "application/javascript");
				res.end(runnerCode);
			} else if (req.url === "/vavite/ready") {
				let message = "end";
				if (currentIndex < files.length) {
					message = "file: " + files[currentIndex];
					currentIndex++;
				}
				res.end(message);
			} else if (req.url === "/vavite/close") {
				workerCount--;
				if (!workerCount) {
					process.exit(failed ? 1 : 0);
				}
			} else if (req.url === "/vavite/message") {
				const msg: any = await parseJsonBody(req);

				if (msg.type === "results") {
					console.log(underline(white(msg.file)!));

					for (const result of msg.results) {
						const [test, error] = result as [string, string?];
						if (!error) {
							console.log(green("[PASS]"), test);
						} else {
							failed = true;
							console.log(red("[FAIL]"), test);
							console.log(
								"       " + error.split("\n").join("\n         ").trimEnd(),
							);
						}
					}

					console.log();
				}

				res.end("ok");
			} else {
				res.statusCode = 404;
				res.end("Not found");
			}
		});
	});

	httpServer.listen(3000, async () => {
		await Promise.all(
			Array(workerCount)
				.fill(0)
				.map((_, i) =>
					browser
						.newPage()
						.then((page) =>
							page.goto(`http://localhost:3000/vavite/page/${i}`),
						),
				),
		);
	});
}

async function parseJsonBody(req: IncomingMessage) {
	return new Promise((resolve, reject) => {
		let body = "";
		req.setEncoding("utf8");

		req.on("error", reject);

		req.on("data", (chunk) => {
			body += chunk;
		});

		req.on("end", () => {
			try {
				resolve(JSON.parse(body));
			} catch (error) {
				reject(error);
			}
		});
	});
}

const htmlTemplate = `<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<meta http-equiv="X-UA-Compatible" content="ie=edge" />
	</head>
	<body>
		<div id="rakkas-app"></div>
		<script type="module" src="/vavite-browser-runner.mjs"></script>
	</body>
</html>`;
