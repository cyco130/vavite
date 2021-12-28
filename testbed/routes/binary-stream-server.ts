import { IncomingRequest } from "vavite";
import { RenderResult } from "../handler";

export default function renderBinaryStream(req: IncomingRequest): RenderResult {
	const delay = parseInt(req.url.searchParams.get("delay") || "0");
	return { raw: raw(delay) };
}

async function* raw(delay: number) {
	let output = new TextEncoder().encode(
		"This is rendered as binary stream with non-ASCII chars 😊",
	);

	for (const byte of output) {
		if (delay) {
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
		yield new Uint8Array([byte]);
	}
}
