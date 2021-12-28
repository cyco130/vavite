import { RequestHandler, IncomingRequest, ResponseBody } from "vavite";
import manifest from "@vavite/manifest";

export type RenderResult =
	| { raw: ResponseBody }
	| { html: string; scripts: string[] };

const handler: RequestHandler = async (req) => {
	if (req.url.pathname === "/cookies") {
		return {
			headers: {
				"Set-Cookie": ["name1=value1", "name2=value2"],
			},
			body: "Multiple cookies set!",
		};
	}

	const routes = {
		"/": () => import("./routes/home-server"),
		"/react": () => import("./routes/react-server"),
		"/binary": () => import("./routes/binary-server"),
		"/str-stream": () => import("./routes/string-stream-server"),
		"/bin-stream": () => import("./routes/binary-stream-server"),
		"/echo-headers": () => import("./routes/echo-headers"),
		"/echo-text": () => import("./routes/echo-text"),
		"/echo-bin": () => import("./routes/echo-bin"),
		"/echo-stream": () => import("./routes/echo-stream"),
	};

	const route = routes[req.url.pathname as keyof typeof routes];

	if (!route) {
		return {
			status: 404,
			headers: { "content-type": "text/html" },
			body: renderHtml(req, `<h1>Not Found</h1>`, []),
		};
	}

	const routeModule = await route();
	const result = await routeModule.default(req);

	if ("raw" in result) {
		return {
			status: 200,
			headers: { "content-type": "text/plain; charset=utf-8" },
			body: result.raw,
		};
	} else {
		const { html, scripts } = result;

		return {
			status: 200,
			headers: { "content-type": "text/html" },
			body: renderHtml(req, html, scripts),
		};
	}
};

export default handler;

function renderHtml(
	req: IncomingRequest,
	contents: string,
	entries: string[],
): string {
	const entrySet = new Set(entries);
	const scripts = new Set<string>();
	const css = new Set<string>();

	for (const entry of entrySet) {
		const chunk = manifest[entry];
		if (chunk) {
			scripts.add(chunk.file);
			chunk.imports?.forEach((i) => entrySet.add(i));
			chunk.css?.forEach((i) => css.add(i));
		}
	}

	return `<!DOCTYPE html>
		<html>
			<head>
				<title>Vavite</title>
				${[...css].map((s) => `<link rel="stylesheet" href="/${s}" />`).join("\n")}
			</head>
			<body>
				<div id="app">${contents}</div>
				<p>
					IP: ${req.ip}<br>
					URL: "${req.url}"
				</p>
				<nav><ul>
					<li><a href="/">Home</a></li>
					<li><a href="/react">React</a></li>
					<li><a href="/binary">Binary</a></li>
					<li><a href="/str-stream">String stream</a></li>
					<li><a href="/bin-stream">Binary stream</a></li>
				</ul></nav>
				${[...scripts]
					.map((s) => `<script type="module" src="/${s}"></script>`)
					.join("\n")}
			</body>
		</html>`;
}
