import { IncomingRequest } from "vavite";
import { RenderResult } from "../handler";

export default function renderStringStream(req: IncomingRequest): RenderResult {
	const delay = parseInt(req.url.searchParams.get("delay") || "0");
	return { raw: raw(delay) };
}

async function* raw(delay: number) {
	let output = "This is rendered as a string stream with non-ASCII chars 😊";

	for (const char of output) {
		if (delay) {
			await new Promise((resolve) => setTimeout(resolve, delay));
		}

		yield char;
	}
}
