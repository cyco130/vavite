import { IncomingRequest } from "vavite";
import { RenderResult } from "../handler";

export default function echoHeaders(req: IncomingRequest): RenderResult {
	return {
		html: `<h1>Headers</h1>
			<pre>${JSON.stringify(req.headers, null, 2)}</pre>
		`,
		scripts: ["routes/home-client.ts"],
	};
}
